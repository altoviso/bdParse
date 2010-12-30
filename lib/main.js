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
  },

  deleteText= function(
    text, 
    deleteList
  ) {
    // deleteList must be a vector of non-overlapping locations to delete from text
    if (!deleteList || !deleteList.length) {
      return text;
    }
    var 
      sorted= deleteList.sort(function(lhs, rhs) { 
        if (lhs.startLine < rhs.startLine) {
          return -1;
        } else if (rhs.startLine < lhs.startLine) {
          return 1;
        } else if (lhs.startCol < rhs.startCol) {
          return -1;
        } else if (rhs.startCol < lhs.startCol) {
          return 1;
        } else {
          return 0;
        }
      }),
      dest= [],
      line, i= 0;
    sorted.forEach(function(item) {
      while (i<item.startLine) dest.push(text[i++]);
      if (item.startLine==item.endLine) {
        line= text[i++];
        dest.push(line.substring(0, item.startCol) + line.substring(item.endCol));
      } else {
        dest.push(text[i++].substring(0, item.startCol));
        while (i<item.endLine) i++;
        dest.push(text[i++].substring(item.endCol));
      }
    });
    while (i<text.length) dest.push(text[i++]);
    return dest;
  },

  parseText= function(
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
  };

return types.mix(types.mix({}, types), {
  filterComments:filterComments,
  tokenize:tokenize, 
  parse:parse, 
  parseText:parseText,
  split:split,
  deleteText:deleteText
});
});
