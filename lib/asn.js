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
    makeComment: function(commentToken) {
      return new asn(arguments.callee.nodeType, commentToken.location, commentToken);
    },
  
    makeLabel: function(label, statement) {
      return new asn(arguments.callee.nodeType, sumLocations(label, statement), [label, statement]);
    },
  
    makeBlock: function(openingBrace, statements, closingBrace) {
      return new asn(arguments.callee.nodeType, sumLocations(openingBrace, closingBrace), statements);
    },
  
    makeSwitch: function(switchToken, switchExpr, caseList, rightBraceToken) {
      // note, as it stands, the caseList can contain any kind of statements; it should
      // only contain case and default statements
      return new asn(arguments.callee.nodeType, sumLocations(switchToken, rightBraceToken), [switchExpr, caseList]);
    },
  
    makeCase: function(caseToken, expression, colonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(caseToken, colonToken), expression);
    },
  
    makeDefault: function(defaultToken ,colonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(defaultToken, colonToken));
    },
  
    makeDebugger: function(debuggerToken, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(debuggerToken, semicolonToken || debuggerToken));
    },
  
    makeDo: function(doToken, body, condition, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(doToken, semicolonToken || condition), [condition, body]);
    },
  
    makeReturn: function(returnToken, expression, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(returnToken, semicolonToken || expression || returnToken), expression, semicolonToken && semicolonToken.comment);
    },
  
    makeThrow: function(throwToken, throwExpr, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(throwToken, semicolonToken || throwExpr), throwExpr, semicolonToken && semicolonToken.comment);
    },
  
    makeVar: function(varToken, vardefs, semicolonToken) {
      // vardefs is a vector of [name, expr]; name is a token, expr is an expression or nil
      return new asn(arguments.callee.nodeType, sumLocations(varToken, semicolonToken || types.back(vardefs)), vardefs);
    },
  
    makeWhile: function(whileToken, whileCondition, whileStatement) {
      return new asn(arguments.callee.nodeType, sumLocations(whileToken, whileStatement || whileCondition), [whileCondition, whileStatement]);
    },
  
    makeWith: function(withToken, withExpr, withStatement) {
      return new asn(arguments.callee.nodeType, sumLocations(withToken, withStatement || withExpr), [withExpr, withStatement]);
    },
  
    makeStatement: function(expression, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(expression || semicolonToken, semicolonToken || expression), expression, semicolonToken && semicolonToken.comment);
    },
  
    makeBreak: function(breakToken, nameToken, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(breakToken, semicolonToken || nameToken || breakToken), nameToken);
    },
  
    makeContinue: function(continueToken, nameToken, semicolonToken) {
      return new asn(arguments.callee.nodeType, sumLocations(continueToken, semicolonToken || nameToken || continueToken), nameToken);
    },
  
    makeForIn: function(forToken, varToken, varName, objectToken, statement) {
      return new asn(arguments.callee.nodeType, sumLocations(forToken, statement), [varToken, varName, objectToken, statement]);
    },
  
    makeFor: function(forToken, varToken, init, test, step, statement, closeParenToken) {
      return new asn(arguments.callee.nodeType, sumLocations(forToken, statement || closeParenToken), [varToken, init, test, step, statement]);
    },
  
    makeFunctionDef: function(functionToken, name, parameterList, comment, body, rightBrace) {
     return new asn(arguments.callee.nodeType, sumLocations(functionToken, rightBrace), [name, parameterList, body], comment);
    },
  
    makeFunctionLiteral: function(functionToken, name, parameterList, comment, body, rightBrace) {
     return new asn(arguments.callee.nodeType, sumLocations(functionToken, rightBrace), [name, parameterList, body], comment);
    },
  
    makeIf: function(ifToken, condition, body, elseToken) {
      return new asn(arguments.callee.nodeType, sumLocations(ifToken, elseToken || body), [condition, body, elseToken]);
    },
  
    makeTry: function(tryToken, body, catchName, catchStatement, finallyStatement) {
      return new asn(arguments.callee.nodeType, sumLocations(tryToken, finallyStatement || catchStatement), [body, catchName, catchStatement, finallyStatement]);
    },
  
    makeExprList: function(openingToken, exprList, closingToken) {
      return new asn(arguments.callee.nodeType, sumLocations(openingToken, closingToken), exprList);
    },
  
    makeNew: function(newToken, newExpr, args) {
      return new asn(arguments.callee.nodeType, sumLocations(newToken, args || newExpr), [newExpr].concat(args));
    },
  
    makeUnaryPrefix: function(op, expr) {
      // (when (and (member op '(:++ :-- :delete)) (not (is-assignable expr)))
      // (error* "Invalid use of '~a' operator." op))
      return new asn(arguments.callee.nodeType, sumLocations(op, expr), [op, expr]);
    },
                                  
    makeUnaryPostfix: function(op, expr) {
      // (when (and (member op '(:++ :-- :delete)) (not (is-assignable expr)))
      // (error* "Invalid use of '~a' operator." op))
      return new asn(arguments.callee.nodeType, sumLocations(expr, op), [op, expr]);
    },
  
    makeArray: function(openingBracket, exprList, closingBacket) {
      return new asn(arguments.callee.nodeType, sumLocations(openingBracket, closingBacket), exprList, openingBracket.comment);
    },
  
    makeObject: function(openingBrace, propertyList, closingBrace) {
      return new asn(arguments.callee.nodeType, sumLocations(openingBrace, closingBrace), propertyList, openingBrace.comment);
    },

    makeName: function(token) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeNumber: function(token) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeString: function(token) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeRegEx: function(token) {
      return new asn(arguments.callee.nodeType, token.location, token);
    },
  
    makeAtom: function(token) {
      // token is a tName, tNumber, tString, tRegEx, or tKeywords (true, false, null)
      switch (token.type) {
        case tName:
        return factories.makeName(token);

        case tNumber:
        return factories.makeNumber(token);

        case tString:
        return factories.makeString(token);

        case tRegEx:
        return factories.makeRegEx(token);
      }
      // should never get here
      return new asn(arguments.callee.nodeType, token.location, token);
    },

    makeBinaryOp: function(lhs, op, rhs, location) {
      // one of... 
      // :dot :sub :call :comma
      // :\\ :&& :\ :^ :& :== :=== :!= :!== :< :> :<= :>= :in :instanceof :>> :<< :>>> :+ :- :* :/ :%
      // := :+= :-= :/= :*= :%= :>>= :<<= :>>>= :~= :%= :\= :^=
      return new asn(arguments.callee.nodeType, location || sumLocations(lhs, rhs), [op, lhs, rhs], op.comment || lhs.comment);
    },
  
    makeConditional: function(condition, trueExpr, falseExpr) {
      return new asn(arguments.callee.nodeType, sumLocations(condition, falseExpr), [condition, trueExpr, falseExpr]);
    },
  
    makeRoot: function(statements) {
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
