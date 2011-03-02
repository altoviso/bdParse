define(["./types", "./tokenize", "./parse", "./asn"], function(types, tokenize, parse) {
  ///
  // \module bdParse.main
  //
  // This module defines the bdParse package.
  //

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
      // This should be platform-independent
      return text.replace(/(\r\n)|(\n\r)/g, "\n").replace(/\r/, "\n").split("\n");
    },
  
    filterComments= function(
      tokens //(array of tokens) tokens to filter
    ) {
      ///
      // Filter all comment tokens about of tokens and return result
      //
      var
        tLineComment= types.symbols["tLineComment"],
        tBlockComment= types.symbols["tBlockComment"],
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
      ///
      // Delete chunks from text.
      //
      // deleteList is a vector of locations (chunks) to delete from text.
      if (!deleteList || !deleteList.length) {
        return text;
      }
  
      // create a new delete list that has a single element for each line in text as follows:
      //   * the element is undefined if the line should be left untouched
      //   * the element is an array of chunks to delete from the particular line otherwise;
      //     each chunk is a pair of [startCol, endCol] to delete; [Number.MAX_VALUE, number.MAX_VALUE]
      //     instructs delete the entire line; [x, number.MAX_VALUE] instructs delete from x to end-of-line.
      var dl= new Array(text.length);
      deleteList.forEach(function(item) {
        if (item.startLine==item.endLine) {
          (dl[item.startLine]= dl[item.startLine] || []).push([item.startCol, item.endCol]);
        } else {
          (dl[item.startLine]= dl[item.startLine] || []).push([item.startCol, Number.MAX_VALUE]);
          for (var i= item.startLine+1; i<item.endLine; i++) dl[i]= [[Number.MAX_VALUE, Number.MAX_VALUE]];
          (dl[item.endLine]= dl[item.endLine] || []).push([0, item.endCol]);
        }
      });
  
      // travere dl, deleting as instructed
      for (var line, chunks, chunk, dest= [], i= 0, end= dl.length; i<end; i++) {
        line= text[i];
        chunks= dl[i];
        if (chunks) {
          // delete one or more chunks from line i
          if (chunks.length>1) {
            // multiple chunks; sort in reverse order
            chunks.sort(function(lhs, rhs) { return rhs[0] - lhs[0]; });
            for (var j= 0, jEnd= chunks.length; j<jEnd; j++) {
              chunk= chunks[j];
              if (chunk[0]==Number.MAX_VALUE) {
                // one of the chunks instructed delete the entire line
                line= 0;
                break;
              } else {
                line= line.substring(0, chunk[0]) + line.substring(chunk[1]);
              }
            }
            if (line!=0) dest.push(line);
          } else {
            chunk= chunks[0];
            if (chunk[0]!=Number.MAX_VALUE) {
              dest.push(line.substring(0, chunk[0]) + line.substring(chunk[1]));
            }
          }
        } else {
          dest.push(line);
        }
      }
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
