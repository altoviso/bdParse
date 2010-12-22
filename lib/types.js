///
// \module bdParse.types
//
// This module defines the user-defined types and a few utility functions used by bdParse.
//
define(function() {

function mix(dest, src) {
  for (var p in src) dest[p]= src[p];
  return dest;
}

function back(vector) {
  return (vector.length && vector[vector.length-1]) || undefined;
}

var symbols= {};

function symbol(value) {
  this.value= value;
}
symbol.prototype.toString= function() {
  return this.value;
};

function makeSymbol(name, set) {
  var s= symbols[name]= symbols[name] || new symbol(name);
  set && (set[name]= s);
  return s;
}

function makeSymbolSet(names) {
  var dest= {};
  names.split(".").forEach(function(symbol) {
    dest[symbol]= symbols[symbol];
  });
  return dest;
}

//
// An input stream is tokenized into the following classes:
// 
// tLineComment
//   a // comment; value holds the comment, including the //
// 
// tBlockComment
//   a /* */ comment; value holds the comment, including the //
// 
// tPunc
//   punctuation; value is single character string that gives the punctuation (one of []{}().,;:)
// 
// tOperator
//   operator; value is a string that gives the operator
// 
// tKeyword
//   keyword; value is a symbol that gives the keyword
// 
// tNumber, tString, tRegEx, tName
//   as indicated; value holds the number, string, regex (a string), name (a string)
//
var tokenTypes= {};
"tLineComment.tBlockComment.tOperator.tKeyword.tPunc.tNumber.tString.tRegEx.tName.tAtom.tEof".split(".").forEach(function(tokenType) {
  makeSymbol(tokenType, tokenTypes);
});
var
  tLineComment= symbols["tLineComment"],
  tBlockComment= symbols["tBlockComment"],
  tOperator= symbols["tOperator"],
  tKeyword= symbols["tKeyword"],
  tPunc= symbols["tPunc"],
  tNumber= symbols["tNumber"],
  tString= symbols["tString"],
  tRegEx= symbols["tRegEx"],
  tName= symbols["tName"],
  tEof= symbols["tEof"];

// these are the keywords
var keywords= {};
"break.case.catch.continue.debugger.default.delete.do.else.false.finally.for.function.if.in.instanceof.new.null.return.switch.throw.true.try.typeof.var.void.while.with".split(".").forEach(function(keyword) {
  makeSymbol(keyword, keywords);
});

// these symbols are expression atoms; this knowledge will be used by the parser
"tNumber.tString.tRegEx.tName.false.null.true".split(".").forEach(function(keyword) {
  symbols[keyword].isExprAtom= true;
});

// these are the operators
// note "[" is subscript; "(" is apply
// manually insert dot
var 
  operators= {},
  operatorStrings= "in.instanceof.typeof.new.void.delete.[.(.++.--.+.-.!.~.&.|.^.*./.%.>>.<<.>>>.<.>.<=.>=.==.===.!=.!==.?.=.+=.-=./=.*=.%=.>>=.<<=.>>>=.~=.%=.|=.^=.&&.||".split(".").forEach(function(op) {
    makeSymbol(op, operators);
  });
makeSymbol(".", operators);

function error(line, col, message) {
  this.line= line;
  this.col= col;
  this.message= message;
};

function location(startLine, startCol, endLine, endCol) {
  if (arguments.length==2) {
    // signature was ([startLine, startCol], [endLine, endCol])
    this.startLine= startLine[0];
    this.startCol= startLine[1];
    this.endLine= startCol[0];
    this.endCol= startCol[1];;
  } else {
    this.startLine= startLine;
    this.startCol= startCol;
    this.endLine= endLine;
    this.endCol= endCol;
  }
}
mix(location.prototype, {
  start: function(colOffset) {
    // notice that colOffset could cause column to become negative or go into next line
    // this must be accounted for by processes that use output from this method
    return [this.startLine, this.startCol + (colOffset || 0)];
  },
  end: function() {
    // notice that colOffset could cause column to become negative or go into next line
    // this must be accounted for by processes that use output from this method
    return [this.endLine, this.endCol];
  }
});

function getLocation(src) {
  return src.location || src;
}

function sumLocations(start, end) {
  start= getLocation(start);
  end= getLocation(end);
  return new location(start.startLine, start.startCol, end.endLine, end.endCol);
}

function token(type, value, location, newlineBefore, comment) {
  this.type= type;
  this.value= value;
  this.location= location;
  this.newlineBefore= newlineBefore;
  this.comment= comment;
}
mix(token.prototype, {
  eq: function(type, value) {
    return this.type===type && this.value==value;
  },

  opEq: function(op) {
    return this.type===tOperator && this.value===op;
  },

  puncEq: function(punc) {
    return this.type===tPunc && this.value===punc;
  },

  keywordEq: function(keyword) {
    return this.value===symbols[keyword];
  },

  line: function() {
    return this.location.startLine;
  },

  col: function() {
    return this.location.startCol;
  },

  copy: function() {
    return new token(this.type, this.value, this.location, this.newlineBefore, this.comment);
  },

  unexpected: function(expected) {
    var message= 
      "[" + (this.location.startLine+1) + ", " + this.location.startCol + "]unexpected token (" + 
      this.type.value + (this.value ? ":'" + this.value + "'" : "") + ")" + (expected ? ("; " + expected) : "");
    return new error(this.startLine+1, this.startCol, message);
  }
});

function asn(
  type,     //(symbol) the type of the production
  location, //(location) the location in the source for this production
  children, //(token | vector)
  comment   //(vector of string) the comment associated with the production
) {
  this.type= type;
  this.comment= comment;
  this.location= location;
  this.children= children;
}

function lexicalVariable(
  name,
  initialValue,
  comment
) {
  this.name= name,
  this.initialValue= initialValue;
  this.comment= comment;
}

return {
  mix:mix,
  back:back,
  symbols:symbols,
  makeSymbol:makeSymbol,
  makeSymbolSet:makeSymbolSet,
  tokenTypes:tokenTypes,
  keywords:keywords,
  operators:operators,
  error:error,
  location:location,
  sumLocations:sumLocations,
  token:token,
  asn:asn,
  lexicalVariable:lexicalVariable
};

});
