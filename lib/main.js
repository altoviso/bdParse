///
// \module bdParse.main
//
// This module defines the bdParse package.
//
define(["./types", "./tokenize", "./parse", "./asn"], function(types, tokenize, parse) {
var
  split= function(
    text //(string) Text to split into lines.
  ) {
    ///
    // Split text into a vector lines as given by new-line indicators contained in text
    ///
    // Three-step algorithm:
    //   * turn CR-LF or LF-CR into simple LF
    //   * turn lone CR into LF
    //   * then split on LF
    //
    return text.replace(/(\r\n)|(\n\r)/g, "\n").replace(/\r/, "\n").split("\n");
  },

  filterComments= function(
    tokens //(array of tokens) tokens to filter
  ) {
    ///
    // Filter all comment tokens about of tokens and return result
    //
    var
      tLineComment=  types.symbols["tLineComment"],
      tBlockComment=  types.symbols["tBlockComment"],
      filtered= [];
    tokens.forEach(function(item) {
      if (item.type!==tLineComment && item.type!==tBlockComment) {
        filtered.push(item);
      }
    });
    return filtered;
  };

  function parseText(
    text,  //(string) JavaScript source to parse.
    filter //(function(array of tokens) --> array of tokens) Filter to apply to text after tokenizing, but before parsing.
  ) {
    ///
    // Splits text into lines, tokenizes, filters tokens, parses, and returns consequent abstract syntax tree.
    //
    text= split(text);
    var 
      tokens= (filter || filterComments)(tokenize(text)),
      tree= parse(tokens);
    return [text, tree];
  }

  return types.mix(types.mix({}, types), {
    tokenize:tokenize, 
    parse:parse, 
    parseText:parseText,
    split:split
  });
});
