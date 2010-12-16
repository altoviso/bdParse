///
// \module bdParse.asn
// 
// This module defines factories for all abstract syntax nodes (ASN)s.
//
define(["./types"], function(types) {
var
  asn= types.asn,
  sumLocations= types.sumLocations,
  symbols= types.symbols,
  tNumber= symbols["tNumber"],
  tString= symbols["tString"],
  tRegEx= symbols["tRegEx"],
  tName= symbols["tName"],

  factories= {
    makeComment: function(
      commentToken //(token (type: tLineComment or tBlockComment)
    ) {
      return new asn(arguments.callee.nodeType, commentToken.location, commentToken);
    },
  
    makeLabel: function(
      labelToken, //(token (type:tName))
      statement   //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(labelToken, statement), [label, statement]);
    },
  
    makeBlock: function(
      openingBrace, //(token (type:tPunc))
      statements,   //(array of asn)
      closingBrace  //(token (type:tPunc))
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(openingBrace, closingBrace), statements);
    },
  
    makeSwitch: function(
      switchToken,    //(token (type:tKeyword, value:"switch"))
      switchExpr,     //(asn)
      caseList,       //(array of asn)
      rightBraceToken //(token (type:tPunc, value:"}")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(switchToken, rightBraceToken), [switchExpr, caseList]);
    },
  
    makeCase: function(
      caseToken,  //(token (type:tKeyword, value:"case")
      expression, //(asn)
      colonToken  //(token (type:tPunc, value:":")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(caseToken, colonToken), expression);
    },
  
    makeDefault: function(
      defaultToken, //(token (type:tKeyword, value:"default"))
      colonToken    //(token type:tPunc, value:":"))
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(defaultToken, colonToken));
    },
  
    makeDebugger: function(
      debuggerToken, //(token (type:tKeyword, value:"debugger"))
      semicolonToken //(token type:tPunc, value:";"))
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(debuggerToken, semicolonToken || debuggerToken));
    },

    makeDo: function(
      doToken,       //(token (type:tKeyword, value:"switch"))
      body,          //(asn)
      condition,     //(asn)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(doToken, semicolonToken || condition), [condition, body]);
    },
  
    makeReturn: function(
      returnToken,   //(token (type:tKeyword, value:"switch"))
      expression,    //(asn or 0)
      semicolonToken //(token (type:tPunc, value:";") or 0)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(returnToken, semicolonToken || expression || returnToken), expression, semicolonToken && semicolonToken.comment);
    },
  
    makeThrow: function(
      throwToken,    //(token (type:tKeyword, value:"switch"))
      throwExpr,     //(asn)
      semicolonToken //(token (type:tPunc, value:";"))
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(throwToken, semicolonToken || throwExpr), throwExpr, semicolonToken && semicolonToken.comment);
    },
  
    makeVar: function(
      varToken,      //(token (type:tKeyword, value:"switch"))
      vardefs,       //(array of lexicalVariable)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      // vardefs is a vector of [name, expr]; name is a token, expr is an expression or nil
      return new asn(arguments.callee.nodeType, sumLocations(varToken, semicolonToken || types.back(vardefs)), vardefs);
    },
  
    makeWhile: function(
      whileToken,     //(token (type:tKeyword, value:"while"))
      whileCondition, //(asn)
      whileStatement  //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(whileToken, whileStatement || whileCondition), [whileCondition, whileStatement]);
    },
  
    makeWith: function(
      withToken,    //(token (type:tKeyword, value:"with"))
      withExpr,     //(asn)
      withStatement //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(withToken, withStatement || withExpr), [withExpr, withStatement]);
    },
  
    makeStatement: function(
      expression,    //(asn)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(expression || semicolonToken, semicolonToken || expression), expression, semicolonToken && semicolonToken.comment);
    },
  
    makeBreak: function(
      breakToken,    //(token (type:tKeyword, value:"break"))
      nameToken,     //(token (type:tName) or 0)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(breakToken, semicolonToken || nameToken || breakToken), nameToken);
    },
  
    makeContinue: function(
      continueToken, //(token (type:tKeyword, value:"switch"))
      nameToken,     //(token (type:tName) or 0)
      semicolonToken //(token (type:tPunc, value:";")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(continueToken, semicolonToken || nameToken || continueToken), nameToken);
    },
  
    makeForIn: function(
      forToken,     //(token (type:tKeyword, value:"for"))
      varToken,     //(token (type:tKeyword, value:"var"))
      varNameToken, //(token (type:tName))
      object,       //(asn)
      statement     //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(forToken, statement), [varNameToken, object, statement]);
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
      return new asn(arguments.callee.nodeType, sumLocations(forToken, statement || closeParenToken), [init, test, step, statement]);
    },
  
    makeFunctionDef: function(
      functionToken,  //(token (type:tKeyword, value:"function"))
      nameToken,      //(token (type:tName))
      parameterList,  //(array of token (type:tName))
      comment,        //(string)
      body,           //(array of asn)
      rightBrace      //(token (type:tPunc, value:"}") or 0)
    ) {
     return new asn(arguments.callee.nodeType, sumLocations(functionToken, rightBrace || body), [name, parameterList, body], comment);
    },
  
    makeFunctionLiteral: function(
      functionToken,  //(token (type:tKeyword, value:"function"))
      nameToken,      //(token (type:tName))
      parameterList,  //(array of token (type:tName))
      comment,        //(string)
      body,           //(array of asn)
      rightBrace      //(token (type:tPunc, value:"}") or 0)
    ) {
     return new asn(arguments.callee.nodeType, sumLocations(functionToken, rightBrace || body), [name, parameterList, body], comment);
    },
  
    makeIf: function(
      ifToken,       //(token (type:tKeyword, value:"if"))
      condition,     //(asn)
      trueStatement, //(asn)
      elseToken,     //(token (type:tKeyword, value:"else"))
      falseStatement //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(ifToken, falseStatement || trueStatement), [condition, trueStatement, falseStatement]);
    },
  
    makeTry: function(
      tryToken,        //(token (type:tKeyword, value:"switch"))
      body,            //(asn)
      catchNameToken,  //(token (type:tName))
      catchStatement,  //(asn)
      finallyStatement //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(tryToken, finallyStatement || catchStatement), [body, catchNameToken, catchStatement, finallyStatement]);
    },
  
    makeExprList: function(
      openingToken, //(token (type:tPunc, value:"(")
      exprList,     //(array of asn)
      closingToken  //(token (type:tPunc, value:")")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(openingToken, closingToken), exprList);
    },
  
    makeNew: function(
      newToken,  //(token (type:tKeyword, value:"new"))
      newExpr,   //(asn)
      args       //(array of asn or 0)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(newToken, args || newExpr), args ? [newExpr].concat(args) : [newExpr]);
    },
  
    makeUnaryPrefix: function(
      op,   //(token (type:tOperator))
      expr  //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(op, expr), [op, expr]);
    },
                                  
    makeUnaryPostfix: function(
      op,   //(token (type:tOperator))
      expr  //(asn)
    ) {
      // (when (and (member op '(:++ :-- :delete)) (not (is-assignable expr)))
      // (error* "Invalid use of '~a' operator." op))
      return new asn(arguments.callee.nodeType, sumLocations(expr, op), [op, expr]);
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
      return new asn(arguments.callee.nodeType, location || sumLocations(lhs, rhs), [op, lhs, rhs], op.comment || lhs.comment);
    },
  
    makeArray: function(
      openingBracket, //(token (type:tPunc, value:"[")
      exprList,       //(array or asn)
      closingBacket   //(token (type:tPunc, value:"]")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(openingBracket, closingBacket), exprList, openingBracket.comment);
    },
  
    makeObject: function(
      openingBrace, //(token (type:tPunc, value:"}")
      propertyList, //(array or [token (type:tName), asn] pairs)
      closingBrace  //(token (type:tPunc, value:"}")
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(openingBrace, closingBrace), propertyList, openingBrace.comment);
    },

    makeName: function(
      token //(token (type:tName))
    ) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeNumber: function(
      token //(token (type:tNumber))
    ) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeString: function(
      token //(token (type:tString))
    ) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeRegEx: function(
      token //(token (type:tRegEx))
    ) {
      return new asn(arguments.callee.nodeType, token.location, token);
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
  
    makeConditional: function(
      condition,//(asn)
      trueExpr, //(asn)
      falseExpr //(asn)
    ) {
      return new asn(arguments.callee.nodeType, sumLocations(condition, falseExpr), [condition, trueExpr, falseExpr]);
    },
  
    makeRoot: function(
      statements //(array of asn)
    ) {
      var
        start= statements[0] || new types.location(0, 0, 0, 0),
        end= types.back(statements) || start;
      return new asn(arguments.callee.nodeType, sumLocations(start, end), statements);
    }
  };

for (var p in factories) {
  factories[p].nodeType= types.makeSymbol("asnt" + p.substring(4));
}

return factories;

});
