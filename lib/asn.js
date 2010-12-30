///
// \module bdParse.asn
// 
// This module defines factories for all abstract syntax nodes (ASN)s.
//
define(["./types"], function(types) {

"Comment.Label.Block.Switch.Case.Default.Debugger.Do.Return.Throw.Var.While.With.Statement.Break.Continue.ForIn.For.FunctionDef.FunctionLiteral.If.Conditional.Try.ExprList.New.UnaryPrefix.UnaryPostfix.BinaryOp.Array.Object.Name.Number.String.RegEx.Atom.Root".split(".").forEach(function(name) {
  types.makeSymbol("asn" +name);
});

var
  asn= types.asn,
  sumLocations= types.sumLocations,
  symbols= types.symbols,
  tNumber= symbols["tNumber"],
  tString= symbols["tString"],
  tRegEx= symbols["tRegEx"],
  tName= symbols["tName"],
  asnComment= symbols["asnComment"],
  asnLabel= symbols["asnLabel"],
  asnBlock= symbols["asnBlock"],
  asnSwitch= symbols["asnSwitch"],
  asnCase= symbols["asnCase"],
  asnDefault= symbols["asnDefault"],
  asnDebugger= symbols["asnDebugger"],
  asnDo= symbols["asnDo"],
  asnReturn= symbols["asnReturn"],
  asnThrow= symbols["asnThrow"],
  asnVar= symbols["asnVar"],
  asnWhile= symbols["asnWhile"],
  asnWith= symbols["asnWith"],
  asnStatement= symbols["asnStatement"],
  asnBreak= symbols["asnBreak"],
  asnContinue= symbols["asnContinue"],
  asnForIn= symbols["asnForIn"],
  asnFor= symbols["asnFor"],
  asnFunctionDef= symbols["asnFunctionDef"],
  asnFunctionLiteral= symbols["asnFunctionLiteral"],
  asnIf= symbols["asnIf"],
  asnConditional= symbols["asnConditional"],
  asnTry= symbols["asnTry"],
  asnExprList= symbols["asnExprList"],
  asnNew= symbols["asnNew"],
  asnUnaryPrefix= symbols["asnUnaryPrefix"],
  asnUnaryPostfix= symbols["asnUnaryPostfix"],
  asnBinaryOp= symbols["asnBinaryOp"],
  asnArray= symbols["asnArray"],
  asnObject= symbols["asnObject"],
  asnName= symbols["asnName"],
  asnNumber= symbols["asnNumber"],
  asnString= symbols["asnString"],
  asnRegEx= symbols["asnRegEx"],
  asnAtom= symbols["asnAtom"],
  asnRoot= symbols["asnRoot"],


  factories= {
    makeComment: function(
      commentToken //(token (type: tLineComment or tBlockComment)
    ) {
      return new asn(asnComment, commentToken.location, commentToken);
    },
  
    makeLabel: function(
      labelToken, //(token (type:tName))
      statement   //(asn)
    ) {
      var result= new asn(asnLabel, sumLocations(labelToken, statement), [labelToken, statement]);
      statement.parent= result;
      return result;
    },
  
    makeBlock: function(
      openingBrace, //(token (type:tPunc))
      statements,   //(array of asn)
      closingBrace  //(token (type:tPunc))
    ) {
      var result= new asn(asnBlock, sumLocations(openingBrace, closingBrace), statements);
      statements.forEach(function(statement){ statement.parent= result; });
      return result;
    },
  
    makeSwitch: function(
      switchToken,    //(token (type:tKeyword, value:"switch"))
      switchExpr,     //(asn)
      caseList,       //(array of asn)
      rightBraceToken //(token (type:tPunc, value:"}")
    ) {
      var result= new asn(asnSwitch, sumLocations(switchToken, rightBraceToken), [switchExpr, caseList]);
      switchExpr.parent= result;
      caseList.forEach(function(caseItem){ caseItem.parent= result; });
      return result;
    },
  
    makeCase: function(
      caseToken,  //(token (type:tKeyword, value:"case")
      expression, //(asn)
      colonToken  //(token (type:tPunc, value:":")
    ) {
      var result= new asn(asnCase, sumLocations(caseToken, colonToken), expression);
      expression.parent= result;
      return result;
    },
  
    makeDefault: function(
      defaultToken, //(token (type:tKeyword, value:"default"))
      colonToken    //(token type:tPunc, value:":"))
    ) {
      return new asn(asnDefault, sumLocations(defaultToken, colonToken));
    },
  
    makeDebugger: function(
      debuggerToken, //(token (type:tKeyword, value:"debugger"))
      semicolonToken //(token type:tPunc, value:";"))
    ) {
      return new asn(asnDebugger, sumLocations(debuggerToken, semicolonToken || debuggerToken));
    },

    makeDo: function(
      doToken,       //(token (type:tKeyword, value:"switch"))
      body,          //(asn)
      condition,     //(asn)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      var result= new asn(asnDo, sumLocations(doToken, semicolonToken || condition), [condition, body]);
      body.parent= condition.parent= result;
      return result;
    },
  
    makeReturn: function(
      returnToken,   //(token (type:tKeyword, value:"switch"))
      expression,    //(asn or 0)
      semicolonToken //(token (type:tPunc, value:";") or 0)
    ) {
      var result= new asn(asnReturn, sumLocations(returnToken, semicolonToken || expression || returnToken), expression, semicolonToken && semicolonToken.comment);
      expression && (expression.parent= result);
      return result;
    },
  
    makeThrow: function(
      throwToken,    //(token (type:tKeyword, value:"switch"))
      throwExpr,     //(asn)
      semicolonToken //(token (type:tPunc, value:";"))
    ) {
      var result= new asn(asnThrow, sumLocations(throwToken, semicolonToken || throwExpr), throwExpr, semicolonToken && semicolonToken.comment);
      throwExpr.parent= result;
      return result;
    },
  
    makeVar: function(
      varToken,      //(token (type:tKeyword, value:"switch"))
      vardefs,       //(array of lexicalVariable)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      // vardefs is a vector of [name, expr]; name is a token, expr is an expression or nil
      return new asn(asnVar, sumLocations(varToken, semicolonToken || types.back(vardefs)), vardefs);
    },
  
    makeWhile: function(
      whileToken,     //(token (type:tKeyword, value:"while"))
      whileCondition, //(asn)
      whileStatement  //(asn)
    ) {
      var result= new asn(asnWhile, sumLocations(whileToken, whileStatement || whileCondition), [whileCondition, whileStatement]);
      whileCondition.parent= whileStatement.parent= result;
      return result;
    },
  
    makeWith: function(
      withToken,    //(token (type:tKeyword, value:"with"))
      withExpr,     //(asn)
      withStatement //(asn)
    ) {
      var result= new asn(asnWith, sumLocations(withToken, withStatement || withExpr), [withExpr, withStatement]);
      withExpr.parent= withStatement.parent= result;
      return result;
    },
  
    makeStatement: function(
      expression,    //(asn)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      var result= new asn(asnStatement, sumLocations(expression || semicolonToken, semicolonToken || expression), expression, semicolonToken && semicolonToken.comment);
      expression.parent= result;
      return result;
    },
  
    makeBreak: function(
      breakToken,    //(token (type:tKeyword, value:"break"))
      nameToken,     //(token (type:tName) or 0)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      return new asn(asnBreak, sumLocations(breakToken, semicolonToken || nameToken || breakToken), nameToken);
    },
  
    makeContinue: function(
      continueToken, //(token (type:tKeyword, value:"switch"))
      nameToken,     //(token (type:tName) or 0)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      return new asn(asnContinue, sumLocations(continueToken, semicolonToken || nameToken || continueToken), nameToken);
    },
  
    makeForIn: function(
      forToken,     //(token (type:tKeyword, value:"for"))
      varToken,     //(token (type:tKeyword, value:"var"))
      varNameToken, //(token (type:tName))
      object,       //(asn)
      statement     //(asn)
    ) {
      var result= new asn(asnForIn, sumLocations(forToken, statement), [varNameToken, object, statement]);
      object.parent= statement.parent= result;
      return result;
    },
  
    makeFor: function(
      forToken,       //(token (type:tKeyword, value:"for"))
      varToken,       //(token (type:tKeyword, value:"var"))
      init,           //([asn or 0, token (type:tPunc, value:";") or 0])
      test,           //([asn or 0, token (type:tPunc, value:";") or 0])
      step,           //(asn or 0)
      statement,      //(asn)
      closeParenToken //(token (type:tPunc, value:")")
    ) {
      var result= new asn(asnFor, sumLocations(forToken, statement || closeParenToken), [init, test, step, statement]);
      init && (init.parent= result);
      test && (test.parent= result);
      step && (step.parent= result);
      statement && (statement.parent= result);
      return result;
    },
  
    makeFunctionDef: function(
      functionToken,  //(token (type:tKeyword, value:"function"))
      nameToken,      //(token (type:tName))
      parameterList,  //(array of token (type:tName))
      comment,        //(string)
      body,           //(array of asn)
      rightBrace      //(token (type:tPunc, value:"}") or 0)
    ) {
      var result= new asn(asnFunctionDef, sumLocations(functionToken, rightBrace || body), [nameToken, parameterList, body], comment);
      body.forEach(function(statement){ statement.parent= result; });
      return result;
    },
  
    makeFunctionLiteral: function(
      functionToken,  //(token (type:tKeyword, value:"function"))
      nameToken,      //(token (type:tName))
      parameterList,  //(array of token (type:tName))
      comment,        //(string)
      body,           //(array of asn)
      rightBrace      //(token (type:tPunc, value:"}") or 0)
    ) {
      var result= new asn(asnFunctionLiteral, sumLocations(functionToken, rightBrace || body), [nameToken, parameterList, body], comment);
      body.forEach(function(statement){ statement.parent= result; });
      return result;
    },
  
    makeIf: function(
      ifToken,       //(token (type:tKeyword, value:"if"))
      condition,     //(asn)
      trueStatement, //(asn)
      elseToken,     //(token (type:tKeyword, value:"else") or 0)
      falseStatement //(asn or 0)
    ) {
      var result= new asn(asnIf, sumLocations(ifToken, falseStatement || trueStatement), [condition, trueStatement, falseStatement]);
      condition.parent= trueStatement.parent= result;
      falseStatement && (falseStatement.parent= result);
      return result;
    },

    makeConditional: function(
      condition,//(asn)
      trueExpr, //(asn)
      falseExpr //(asn)
    ) {
      var result= new asn(asnConditional, sumLocations(condition, falseExpr), [condition, trueExpr, falseExpr]);
      condition.parent= trueExpr.parent= falseExpr.parent= result;
      return result;
    },
    
    makeTry: function(
      tryToken,        //(token (type:tKeyword, value:"switch"))
      body,            //(asn)
      catchNameToken,  //(token (type:tName))
      catchStatement,  //(asn)
      finallyStatement //(asn)
    ) {
      var result= new asn(asnTry, sumLocations(tryToken, finallyStatement || catchStatement), [body, catchNameToken, catchStatement, finallyStatement]);
      body.parent= result;
      catchStatement && (catchStatement.parent= result);
      finallyStatement && (finallyStatement.parent= result);
      return result;
    },
  
    makeExprList: function(
      openingToken, //(token (type:tPunc, value:"(")
      exprList,     //(array of asn)
      closingToken  //(token (type:tPunc, value:")")
    ) {
      var result= new asn(asnExprList, sumLocations(openingToken, closingToken), exprList);
      exprList.forEach(function(statement){ statement.parent= result; });      
      return result;
    },
  
    makeNew: function(
      newToken,  //(token (type:tKeyword, value:"new"))
      newExpr,   //(asn)
      args       //(array of asn or 0)
    ) {
      var result= new asn(asnNew, sumLocations(newToken, args || newExpr), args ? [newExpr].concat(args) : [newExpr]);
      newExpr.parent= result;
      args && args.forEach(function(arg){ arg.parent= result; });      
      return result;
    },
  
    makeUnaryPrefix: function(
      op,   //(token (type:tOperator))
      expr  //(asn)
    ) {
      var result= new asn(asnUnaryPrefix, sumLocations(op, expr), [op, expr]);
      expr.parent= result;
      return result;
    },
                                  
    makeUnaryPostfix: function(
      op,   //(token (type:tOperator))
      expr  //(asn)
    ) {
      // (when (and (member op '(:++ :-- :delete)) (not (is-assignable expr)))
      // (error* "Invalid use of '~a' operator." op))
      var result= new asn(asnUnaryPostfix, sumLocations(expr, op), [op, expr]);
      expr.parent= result;
      return result;
    },

    makeBinaryOp: function(
      lhs,   //(asn)
      op,    //(token (type:tOperator))
      rhs,   //(asn)
      location //(location or 0) nonzero iff op is "[" or "("; need this because closing "]"/")" is not sent in
    ) {
      // one of... 
      // :dot :sub :call :comma
      // :\\ :&& :\ :^ :& :== :=== :!= :!== :< :> :<= :>= :in :instanceof :>> :<< :>>> :+ :- :* :/ :%
      // := :+= :-= :/= :*= :%= :>>= :<<= :>>>= :~= :%= :\= :^=
      var result= new asn(asnBinaryOp, location || sumLocations(lhs, rhs), [op, lhs, rhs], op.comment || lhs.comment);
      lhs.parent= rhs.parent= result;
      return result;
    },
  
    makeArray: function(
      openingBracket, //(token (type:tPunc, value:"[")
      exprList,       //(array of asn)
      closingBacket   //(token (type:tPunc, value:"]")
    ) {
      var result= new asn(asnArray, sumLocations(openingBracket, closingBacket), exprList, openingBracket.comment);
      exprList.forEach(function(expr){ expr.parent= result; });      
      return result;
    },
  
    makeObject: function(
      openingBrace, //(token (type:tPunc, value:"}")
      propertyList, //(array or [token (type:tName), asn] pairs)
      closingBrace  //(token (type:tPunc, value:"}")
    ) {
      var result= new asn(asnObject, sumLocations(openingBrace, closingBrace), propertyList, openingBrace.comment);
      propertyList.forEach(function(property){ property[1].parent= result; });      
      return result;
    },

    makeName: function(
      token //(token (type:tName))
    ) {
      return new asn(asnName, token.location, token);
    },

    makeNumber: function(
      token //(token (type:tNumber))
    ) {
      return new asn(asnNumber, token.location, token);
    },

    makeString: function(
      token //(token (type:tString))
    ) {
      return new asn(asnString, token.location, token);
    },

    makeRegEx: function(
      token //(token (type:tRegEx))
    ) {
      return new asn(asnRegEx, token.location, token);
    },
  
    makeAtom: function(
      token //(token (type: tName or tNumber or tString or tRegEx))
    ) {
      switch (token.type) {
        case tName:   return factories.makeName(token);
        case tNumber: return factories.makeNumber(token);
        case tString: return factories.makeString(token);
        case tRegEx:  return factories.makeRegEx(token);
      }
      throw token.unexpected();
    },
  
    makeRoot: function(
      statements //(array of asn)
    ) {
      var
        start= statements[0] || new types.location(0, 0, 0, 0),
        end= types.back(statements) || start,
        result= new asn(asnRoot, sumLocations(start, end), statements);
      statements.forEach(function(statement){ statement.parent= result; });      
      return result;
    }
  };

return factories;

});
