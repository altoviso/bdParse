///
// \module bdParse.parse
//
// This module defines bdParse.parse.
//
define(["./types", "./asn"], function(types, asn) {
var
  symbols= types.symbols,
  sumLocations= types.sumLocations,
  mix= types.mix,

  // tokens
  tLineComment= symbols["tLineComment"],
  tBlockComment= symbols["tBlockComment"],
  tOperator= symbols["tOperator"],
  tKeyword= symbols["tKeyword"],
  tPunc= symbols["tPunc"],
  tNumber= symbols["tNumber"],
  tString= symbols["tString"],
  tRegEx= symbols["tRegEx"],
  tName= symbols["tName"],
  tEof= symbols["tEof"],

  prog1= function(a) {
    // lisp prog1
    return a;
  },

  unaryPrefix= types.makeSymbolSet("typeof.void.delete.--.++.!.~.-.+"),
  
  isUnaryPrefix= function(token) {
    return token.type==tOperator && unaryPrefix[token.value];
  },

  unaryPostfix= types.makeSymbolSet("--.++"),
  
  isUnaryPostfix= function(token) {
    return token.type==tOperator && unaryPostfix[token.value];
  },

  assignment= types.makeSymbolSet("=.+=.-=.*=./=.%=.<<=.>>=.>>>=.&=.^=.|="),
  
  isAssignment= function(token) {
    return token.type===tOperator && assignment[token.value];
  },

  precedence= {
    "||": 1,

    "&&": 2,

    "|":  3,

    "^":  4,

    "&":  5,

    "==": 6,
    "===":6,
    "!=": 6,
    "!==":6,

    "<":  7,
    ">":  7,
    "<=": 7,
    ">=": 7,
    "in": 7,
    "instanceof": 7,

    "<<": 8,
    ">>": 8,
    ">>>":8,

    "+":  9,
    "-":  9,

    "*":  10,
    "/":  10,
    "%":  10
  },

  getPrecedence= function(op) {
    return precedence[op] || 0;
  };

function parse(tokens, strictSemicolons) {

var
  token,
  tokenPtr= 0,

  next= function() {
    return (token= tokens[tokenPtr++]);
  },

  peek= function() {
    return tokens[tokenPtr];
  },

  skip= function(n) {
    tokenPtr+= (n-1);
    return next();
  },

  eatComments= function() {
    while (token.type===tLineComment || token.type===tBlockComment) next();
  },

  getTokenAndAdvance= function(eatComments) {
    eatComments && eatComments();
    return prog1(token, next());
  },

  expectPunc= function(punc) {
    if (token.type===tPunc && token.value==punc) {
      return prog1(token, next());
    }
    throw token.unexpected("expected " + punc);
  },

  expectKeyword= function(word) {
    if (token.value===symbols[word]) {
      return prog1(token, next());
    }
    throw token.unexpected("expected keyword " + word);
  },

  expectSemicolon= function() {
    // TODO come back to this...should always return 0
    if (strictSemicolons) {
      return expectPunc(";");
    } else if (token.puncEq(";")) {
      return getTokenAndAdvance();
    } else if (token.newlineBefore) {
      return 0;
    } else if (token.puncEq("}")) {
      // maybe this is a block on a line without a semicolon, e.g.,
      //      { i= 1 + 2 }
      // assume this is what is happening; if not, we'll get an error at the next token
      return 0;   
    } else {
      throw token.unexpected("expected ;");
    }
  },

  maybeBeforeSemicolon= function(tryBranch) {
    if (token.puncEq(";")) {
      return [0, getTokenAndAdvance()];
    } else {
      var start= token;
      try {
        return [tryBranch.call(), expectSemicolon()];
      } catch (e) {
        //TODO--revisit this
        if (token===start && token.newlineBefore && !strictSemicolons) {
          return [0, 0];
        } else {
          throw e;
        }
      }
    }
  },

  vardefs= function() {
    eatComments();
    if (token.type!==tName) {
      throw token.unexpected("expected identifier");
    }
    var 
      name= getTokenAndAdvance(),
      initialValue, comment;
    if (token.opEq("=")) {
      comment= getTokenAndAdvance().comment;
      initialValue= expression(false);
    }
    if (token.puncEq(",")) {
      return [new types.lexicalVariable(name, initialValue, getTokenAndAdvance().comment || comment)].concat(vardefs());
    } else {
      return [new types.lexicalVariable(name, initialValue, (token.puncEq(";") && token.comment) || comment)];
    }
  },

  // token and keyword parsing procedures
  parseProcs= {
    //
    // token types
    //
    "tLineComment": function() {
      return prog1(asn.makeComment(token), next());
    },
  
    "tBlockComment": function() {
      return prog1(asn.makeComment(token), next());
    },
  
    "tNumber": function() {
      return simpleStatement();
    },
  
    "tString": function() {
      return simpleStatement();
    },
  
    "tRegEx": function() {
      return simpleStatement();
    },
  
    "tOperator": function() {
      return simpleStatement();
    },
  
    "tName": function() {
      if (peek().puncEq(":")) {
        var labelToken= token;
        skip(2);
        var s= statement();
        return asn.makeLabel(labelToken, s);
      } else {
        return simpleStatement();
      }
    },
  
    "tPunc": function() {
      if (token.value=="{") {
        return block();
      } else if (token.value=="[" || token.value=="(") {
        return simpleStatement();
      } else if (token.value==";") {
        return asn.makeStatement(0, getTokenAndAdvance());
      } else {
        throw token.unexpected();
      }
    },
  
    "tKeyword": function(allowCase) {
      var parse= parseProcs[token.value.value];
      if (parse) {
        return parse(getTokenAndAdvance(), allowCase);
      }
      throw token.unexpected();
    },

    //
    // keywords
    //
    "break": function(statementToken) {
      if (token.type===tName) {
        return asn.makeBreak(statementToken, getTokenAndAdvance(), expectSemicolon());
      } else {
        return asn.makeBreak(statementToken, 0, expectSemicolon());
      }
    },
  
    "continue": function(statementToken) {
      if (token.type===tName) {
        return asn.makeContinue(statementToken, getTokenAndAdvance(), expectSemicolon());
      } else {
        return asn.makeContinue(statementToken, 0, expectSemicolon());
      }
    },
  
    "case": function(token, allowCase) {
      if (allowCase) {
        return asn.makeCase(token, expression(), expectPunc(":"));
      }
      throw token.unexpected();
    },
  
    "default": function(token, allowCase) {
      if (allowCase) {
        return asn.makeDefault(token, expectPunc(":"));
      }
      throw token.unexpected();
    },
  
    "debugger": function(token) {
      return asn.makeDebugger(token, expectSemicolon());
    },
  
    "do": function(token) {
      var 
        body= statement(),
        condition= expectKeyword("while") && parenthesized();
      return asn.makeDo(token, condition, body, expectSemicolon());
    },
  
    "for": function(forToken) {
      expectPunc("(");
      var varToken= 0;
      if (token.keywordEq("var")) {
        varToken= getTokenAndAdvance();
      }
      if (token.type===tName && peek().opEq("in")) {
        var varNameToken= getTokenAndAdvance();
        next(); //eat the in
        var objectExpr= expression();
        expectPunc(")");
        return asn.makeForIn(forToken, varToken, varNameToken, objectExpr, statement());
      } else {
        var
          init= maybeBeforeSemicolon(varToken ? vardefs : expression),
          test= maybeBeforeSemicolon(expression),
          step= token.puncEq(")") ? 0 : expression(),
          closeParen= expectPunc(")");
        return asn.makeFor(forToken, varToken, init, test, step, statement(), closeParen);
      }
    },
  
    "function": function(functionToken, literal) {
      // literal implies a function literal expression e.g....
      //   x= function(...){...} 
      //   someFunction(x, function(...){...}, ...)
      // not literal implies a definition like function x(...){...}
  
      function lambdaList() {
        var nameToken, result= [];
        while (!token.puncEq(")")) {
          if (token.type===tName) {
            result.push(nameToken= getTokenAndAdvance());
            if (token.puncEq(",")) {
              nameToken.comment= nameToken.comment || token.comment;
              next();
            }
          } else {
            throw token.unexpected("while processing lambda list");
          }
        }
        next();
        return result;
      }
  
      var nameToken= token.type===tName ? getTokenAndAdvance() : 0;
      if (!literal && !nameToken) {
        throw token.unexpected();
      }
      expectPunc("(");
      var 
        parameterList= lambdaList(),
        comment= functionToken.comment || expectPunc("{").comment,
        body= [];
     
      while (!token.puncEq("}")) {
        body.push(statement());
      }
      return ((literal ? asn.makeFunctionLiteral : asn.makeFunctionDef)(functionToken, nameToken, parameterList, comment, body, expectPunc("}")));
    },
  
    "if": function(ifToken) {
      var
        condition= parenthesized(),
        trueStatement= statement(),
        elseToken= 0,
        falseStatement= 0;
      if (token.keywordEq("else")) {
        elseToken= getTokenAndAdvance();
        falseStatement= statement();
      }
      return asn.makeIf(ifToken, condition, trueStatement, elseToken, falseStatement);
    },
  
    "return": function(returnToken) {
      var mvb= maybeBeforeSemicolon(expression);
      return asn.makeReturn(returnToken, mvb[0], mvb[1]);
    },
  
    "switch": function(switchToken) {
      var
        switchExpr= parenthesized(),
        caseList= [];
      expectPunc("{");
      while (!token.puncEq("}")) {
        caseList.push(statement(true));
      }
      return asn.makeSwitch(switchToken, switchExpr, caseList, expectPunc("}"));
    },
  
    "throw": function(throwToken) {
      return asn.makeThrow(throwToken, expression(), expectSemicolon());
    },
  
    "try": function(tryToken) {
      var 
        body= statement(),
        catchNameToken, catchStatement, finallyStatement;
      if (token.keywordEq("catch")) {
        next();
        expectPunc("(");
        if (token.type===tName) {
          catchNameToken= token;
          next();
          expectPunc(")");
          catchStatement= statement();
        } else {
          throw token.unexpected("expected name with catch clause");
        }
      }
      if (token.keywordEq("finally")) {
        next();
        finallyStatement= statement();
      }
      if (!catchNameToken && !finallyStatement) {
        throw token.unexpected("expected catch or finally clause");
      }
      return asn.makeTry(tryToken, body, catchNameToken, catchStatement, finallyStatement);
    },      
  
    "var": function(varToken) {
      return asn.makeVar(varToken, vardefs(), expectSemicolon());
    },
  
    "while": function(whileToken) {
      return asn.makeWhile(whileToken, parenthesized(), statement());
    },
  
    "with": function(withToken) {
      return asn.makeWith(withToken, parenthesized(), statement());
    }
  },

  //
  // expressions
  //
  exprList= function(closing) {
    var 
      first= true,
      list= [];
    while (!token.puncEq(closing)) {
      if (first) {
        first= false;
      } else {
        expectPunc(",");
      }    
      list.push(expression(false));
    }
    return list;
  },

  parenthesized= function() {
    var
      opening= expectPunc("("),
      expr= expression(),
      closing= expectPunc(")");
    expr.location= sumLocations(opening, closing);
    return expr;
  },

  arrayExpr= function() {
    var
      opening= expectPunc("["),
      subscripts= exprList("]"),
      closing= expectPunc("]");
    return asn.makeArray(opening, subscripts, closing);
  },

  objectExpr= function() {
    function getName() {
      var token= getTokenAndAdvance();
      if (token.type===tNumber) {
        //TODO don't understand how it could be a number
        return mix(token.copy(), {type: tName, value: token.value+""});
      } else if (token.type===tKeyword) {
        return mix(token.copy(), {type: tName, value: token.value.value});
      } else if (token.type===tString) {
        return mix(token.copy(), {type: tName, value: token.value});
      } else if (token.type===tName) {
        return token;
      } else {
        throw token.unexpected("expected name");
      }
    }

    var 
      opening= expectPunc("{"),
      first= true,
      list= [];
    while (!token.puncEq("}")) {
      if (first) {
        first= false;
      } else {
        expectPunc(",");
      }
      var 
        name= getName(),
        colon= expectPunc(":"),
        rhs= expression(false);
      name.comment= name.comment || colon.comment;
      list.push([name, rhs]);
    }
    var closing= expectPunc("}");
    return asn.makeObject(opening, list, closing);
    return list;
  },

  newExpr= function() {
    var
      newToken= getTokenAndAdvance(),
      newExpr= atomExpr(),
      args= token.puncEq("(") ? asn.makeExprList(getTokenAndAdvance(), exprList(")"), getTokenAndAdvance()) : 0;
    return subscriptsExpr(asn.makeNew(newToken, newExpr, args), true);
  },

  atomExpr= function(allowCalls) {
    eatComments();
    if (token.opEq("new")) {
      return newExpr();
    } else if (isUnaryPrefix(token)) {
      return asn.makeUnaryPrefix(getTokenAndAdvance(), atomExpr(allowCalls));
    } else if (token.keywordEq("function")) {
      var functionTree= parseProcs["function"](getTokenAndAdvance(), true);
      // possible immediate application of literal function
      return token.puncEq("(") ? subscriptsExpr(functionTree) : functionTree;
    } else if (token.type.isExprAtom) {
      // for number, string, regex, name
      return subscriptsExpr(asn.makeAtom(getTokenAndAdvance()), allowCalls);
    } else if (token.value.isExprAtom) {
      // for keywords true, false, null
      return subscriptsExpr(asn.makeAtom(mix(getTokenAndAdvance().copy(), {type: tName, value: token.value.value})), allowCalls);
    } else if (token.puncEq("(")) {
      return subscriptsExpr(parenthesized(), true);
    } else if (token.puncEq("[")) {
      return subscriptsExpr(arrayExpr(), true);
    } else if (token.puncEq("{")) {
      return subscriptsExpr(objectExpr(), true);
    } else {
      throw token.unexpected("expected atom for expression");
    }
  },

  subscriptsExpr= function(expr, allowCalls) {
    function getName() {
      var token= getTokenAndAdvance();
      if (token.type===tKeyword) {
        return asn.makeAtom(mix(token.copy(), {type: tName, value: token.value.value}));
      } else if (token.type===tName) {
        return asn.makeAtom(token);
      } else {
        throw token.unexpected("expected name");
      }
    }
    if (token.puncEq(".")) {
      return subscriptsExpr(asn.makeBinaryOp(expr, getTokenAndAdvance(), getName()), allowCalls);
    } else if (token.puncEq("[")) {
      var
        opening= getTokenAndAdvance(),
        subExpr= expression(),
        closing= expectPunc("]");
      return subscriptsExpr(asn.makeBinaryOp(expr, opening, subExpr, sumLocations(opening, closing)), allowCalls);
    } else if (token.puncEq("(")) {
      var
        opening= getTokenAndAdvance(),
        args= exprList(")"),
        closing= getTokenAndAdvance();
      expr.comment= expr.comment || opening.comment;
      return subscriptsExpr(asn.makeBinaryOp(expr, opening, args, sumLocations(expr, closing)), true);
    } else if (isUnaryPostfix(token) && allowCalls) {
      return asn.makeUnaryPostfix(getTokenAndAdvance(), expr);
    } else {
      return expr;
    }
  },

  opExpr= function(lhs, minPrecedence) {
    var
      op= token.type===tOperator && token,
      precedence= op && getPrecedence(op.value);
    if (precedence && precedence > minPrecedence) {
      var rhs= (next() && opExpr(atomExpr(true), precedence));
      return opExpr(asn.makeBinaryOp(lhs, op, rhs), minPrecedence);
    } else {
      return lhs;
    }
  },

  maybeConditional= function() {
    var expr= opExpr(atomExpr(true), 0);
    if (token.opEq("?")) {
      var trueCase= next() && maybeAssign();
      expectPunc(":");
      var falseCase= maybeAssign();
      return asn.makeConditional(expr, trueCase, falseCase);
    }
    return expr;
  },

  isAssignable= function(expr) {
    return (expr.type===symbols["asnName"]) ||
           (expr.type===symbols["asnBinaryOp"] && (expr.children[0].eq(tPunc, ".") || expr.children[0].eq(tPunc, "[")));
  },

  maybeAssign= function() {
    var lhs= maybeConditional();
    if (isAssignment(token)) {
      if (isAssignable(lhs)) {
        return asn.makeBinaryOp(lhs, getTokenAndAdvance(), maybeAssign());
      } else {
        throw token.unexpected("left-hand-side is not assignable");
      }
    } else {
      return lhs;
    }
  },

  expression= function(commas) {
    if (commas!==false) {
      commas= true;
    }
    var expr= maybeAssign();
    if (commas && token.puncEq(",")) {
      return asn.makeBinaryOp(expr, getTokenAndAdvance(), expression());
    } else {
      return expr;
    }
  },

  //
  // statements and blocks
  //
  statement= function(allowCase) {
    var parse= parseProcs[token.type.value];
    if (parse) {
      return parse(allowCase);
    }
    throw token.unexpected();
  },

  simpleStatement= function() {
    return asn.makeStatement(expression(), expectSemicolon());
  },

  block= function() {
    // on entry, token must be "{"
    var 
      start= getTokenAndAdvance(),
      statements= [];
    while (!token.puncEq("}")) {
      statements.push(statement());
    }
    return asn.makeBlock(start, statements, getTokenAndAdvance());
  },

  statements= [];

  next();
  while (token.type!==tEof) {
    statements.push(statement());
  }

  return asn.makeRoot(statements);
}

return parse;

});
