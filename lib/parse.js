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


//(defvar label-stack)

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

  unexpected= function(token, expected) {
    var message= 
      "[" + token.location.startLine + ", " + token.location.startCol + "]unexpected token (" + 
      token.type.value + (token.value ? ", " + token.value : "") + ")" + (expected ? ("; " + expected) : "");
    return new types.error(token.startLine, token.startCol, message);
  },

  expectPunc= function(punc) {
    if (token.type===tPunc && token.value==punc) {
      return prog1(token, next());
    }
    throw unexpected(token, "expected " + punc);
  },

  expectKeyword= function(word) {
    if (token.value===symbols[word]) {
      return prog1(token, next());
    }
    throw unexpected(token, "expected keyword " + word);
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
      throw unexpected(token, "expected ;");
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

  labelSet= [],
  isLabel= function(label) {
    for (var i= 0, end= labelSet.length; i<end; i++) if (labelSet[i]==label) {
      return true;
    }
    return false;
  },

  vardefs= function() {
    eatComments();
    if (token.type!==tName) {
      throw unexpected(token, "expected identifier");
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
        labelSet.push(token.value);
        var s= statement();
        labelSet.pop();
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
        throw unexpected(token);
      }
    },
  
    "tKeyword": function(allowCase) {
      var parse= parseProcs[token.value.value];
      if (parse) {
        return parse(getTokenAndAdvance(), allowCase);
      }
      throw unexpected(token);
    },

    //
    // keywords
    //
    "break": function(statementToken) {
      if (token.type===tName) {
        if (isLabel(token.value)) {
          return asn.makeBreak(statementToken, getTokenAndAdvance(), expectSemicolon());
        } else {
          throw unexpected(token, "unknown label");
        }
      } else {
        return asn.makeBreak(statementToken, 0, expectSemicolon());
      }
    },
  
    "continue": function(statementToken) {
      if (token.type===tName) {
        if (isLabel(token.value)) {
          return asn.makeContinue(statementToken, getTokenAndAdvance(), expectSemicolon());
        } else {
          throw unexpected(token, "unknown label");
        }
      } else {
        return asn.makeContinue(statementToken, 0, expectSemicolon());
      }
    },
  
    "case": function(token, allowCase) {
      if (allowCase) {
        return asn.makeCase(token, expression(), expectPunc(":"));
      }
      throw unexpected(token);
    },
  
    "default": function(token, allowCase) {
      if (allowCase) {
        return asn.makeDefault(token, expectPunc(":"));
      }
      throw unexpected(token);
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
        varToken= prog1(token, next());
      }
      if (token.type===tName && peek().opEq("in")) {
        var varName= token.value;
        skip(2);
        var objectExpr= expression();
        expectPunc(")");
        return asn.makeForIn(forToken, varToken, varName, objectExpr, statement());
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
        if (token.puncEq(")")) {
          next();
          return [];
        }
        if (token.type===tName) {
          var
            name= token.value,
            comment= getTokenAndAdvance().comment;
          if (token.puncEq(",")) {
            comment= comment || token.comment;
            next();
            return [[name, comment]].concat(lambdaList());
          }
          next();
          return [[name, comment]];
        }
        throw unexpected(token, "while processing lambda list");
      }
  
      var name= token.type===tName ? getTokenAndAdvance().value : 0;
      if (!literal && !name) {
        throw unexpected(token);
      }
      expectPunc("(");
      var 
        parameterList= lambdaList(),
        comment= expectPunc("{").comment,
        body= [];
     
      while (!token.puncEq("}")) {
        body.push(statement());
      }
      return ((literal ? asn.makeFunctionLiteral : asn.makeFunctionDef)(functionToken, name, parameterList, comment, body, expectPunc("}")));
    },
  
    "if": function(ifToken) {
      return asn.makeIf(ifToken, parenthesized(), statement(), (token.keywordEq("else") ? (next() && statement()) : 0));
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
        catchName, catchStatement, finallyStatement;
      if (token.keywordEq("catch")) {
        next();
        expectPunc("(");
        if (token.type===tName) {
          catchName= token;
          next();
          expectPunc(")");
          catchStatement= statement();
        } else {
          throw unexpected(token, "expected name with catch clause");
        }
      }
      if (token.keywordEq("finally")) {
        next();
        finallyStatement= statement();
      }
      if (!catchName && !finallyStatement) {
        throw unexpected(token, "expected catch or finally clause");
      }
      return asn.makeTry(tryToken, body, catchName, catchStatement, finallyStatement);
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
        return asn.makeAtom(mix(token.copy(), {type: tName, value: token.value+""}));
      } else if (token.type===tKeyword) {
        return asn.makeAtom(mix(token.copy(), {type: tName, value: token.value.value}));
      } else if (token.type===tString) {
        return asn.makeAtom(mix(token.copy(), {type: tName, value: token.value}));
      } else if (token.type===tName) {
        return asn.makeAtom(token);
      } else {
        throw unexpected(token, "expected name");
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
      args= token.puncEq("(") ? asn.makeExprList(getTokenAndAdvance(), exprList(")"), getTokenAndAdvance()) : [];
    return subscriptsExpr(asn.makeNew(newToken, newExpr, args), true);
  },

  atomExpr= function(allowCalls) {
    eatComments();
    if (token.opEq("new")) {
      return newExpr();
    } else if (isUnaryPrefix(token)) {
      return asn.makeUnaryPrefix(getTokenAndAdvance().value, atomExpr(allowCalls));
    } else if (token.keywordEq("function")) {
      return parseProcs["function"](getTokenAndAdvance(), true);
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
      throw unexpected(token, "expected atom for expression");
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
        throw unexpected(token, "expected name");
      }
    }
    if (token.puncEq(".")) {
      next();
      return subscriptsExpr(asn.makeBinaryOp(expr, ".", getName()), allowCalls);
    } else if (token.puncEq("[")) {
      var
        opening= getTokenAndAdvance(),
        subExpr= expression(),
        closing= expectPunc("]");
      return subscriptsExpr(asn.makeBinaryOp(expr, "[", subExpr, sumLocations(opening, closing)), allowCalls);
    } else if (token.puncEq("(")) {
      var
        opening= getTokenAndAdvance(),
        args= exprList(")"),
        closing= getTokenAndAdvance();
      expr.comment= expr.comment || opening.comment;
      return subscriptsExpr(asn.makeBinaryOp(expr, "(", args, sumLocations(expr, closing)), true);
    } else if (isUnaryPostfix(token) && allowCalls) {
      return asn.makeUnaryPostfix(getTokenAndAdvance().value, expr);
    } else {
      return expr;
    }
  },

  opExpr= function(lhs, minPrecedence) {
    var
      op= token.type===tOperator && token.value,
      precedence= op && getPrecedence(op);
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
      //var trueCase= (next() && opExpr(atomExpr(true), 0));
      var trueCase= next() && maybeAssign();
      expectPunc(":");
      //var falseCase= opExpr(atomExpr(true), 0);
      var falseCase= maybeAssign();
      return asn.makeConditional(expr, trueCase, falseCase);
    }
    return expr;
  },

  isAssignable= function(expr) {
    return (expr.type===symbols["asntName"]) ||
           (expr.type===symbols["asntBinaryOp"] && (expr.children[0]==="." ||  expr.children[0]==="["));
  },

  maybeAssign= function() {
    var lhs= maybeConditional();
    if (isAssignment(token)) {
      if (isAssignable(lhs)) {
        return asn.makeBinaryOp(lhs, getTokenAndAdvance().value, maybeAssign());
      } else {
        throw unexpected(token, "left-hand-side is not assignable");
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
      return asn.makeBinaryOp(expr, getTokenAndAdvance().value, expression());
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
    throw unexpected(token);
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

  statements= [],
  e;

  try {
    next();
    while (token.type!==tEof) {
      statements.push(statement());
    }
  } catch(e) {
    console.log(e);
  }

  return asn.makeRoot(statements);
}

return parse;

});
