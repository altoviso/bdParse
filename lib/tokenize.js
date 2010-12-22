///
// \module bdParse.tokenize
//
// The module defines bdParse.tokenize.
//
define(["./types"], function(types) {
var
  keywords= types.keywords,
  atomKeywords= types.atomKeywords,
  operators= types.operators,
  error= types.error,
  location= types.location,
  token= types.token,
  symbols= types.symbols,
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
  keywordsBeforeExpression= types.makeSymbolSet("return.new.delete.throw"),

  tokenize= function(source) {
    var
      result= [],
      startLine, startCol,
      line= -1,
      lineCount= source.length,
      regExAllowed= true,
      newlineBefore, col, text, textLength,
      t,
  
      advanceLine= function() {
        line++;
        if (line<lineCount) {
          text= source[line];
          textLength= text.length;
          col= 0;
          newlineBefore= true;
        }
      },
    
      peek= function() {
        return (line==lineCount ? false 
                                : (col==textLength ? "\n"
                                                   : text.charAt(col)));
      },
    
      peek2= function() {
        var c= col+1;
        return ((line==lineCount || c>textLength)  ? false 
                                                   : (c==textLength ? "\n"
                                                                    : text.charAt(c)));
      },
    
      next= function(eofCausesError) {
        if (line==lineCount) {
          if (eofCausesError) {
            throw new error(line, 0, "unexpected end-of-file");
          } else {
            return false;
          }
        } else if (col==textLength) {
          advanceLine();
          return "\n";
        } else {
          return text[col++];
        }
      },
    
      makeToken= function(type, value) {
        regExAllowed= 
          type===tLineComment || 
          type===tBlockComment || 
          type===tOperator || 
          (type===tKeyword && keywordsBeforeExpression[value]) ||
          (type===tPunc && "[{}(,.;:".indexOf(value)!=-1);
        var result= new token(type, value, new location(startLine, startCol, line, col), newlineBefore);
        newlineBefore= false;
        return result;
      },
    
      skipWhitespace= function() {
        var c;
        while ((c= peek()) && /\s/.test(c)) next();
      },
    
      readNumber= function() {
        var match= text.substring(col).match(/^((0(x|X)[0-9a-fA-F]+)|(\d*(\.\d+)?((E|e)(\+|\-)?\d+)?))/);
        if (match && match[0].length) {
          col+= match[0].length;
          return makeToken(tNumber, Number(match[0]));
        } else {
          throw new error(line, col, "expected number");
        }
      },
    
      handleDot= function() {
        // peek()=="." on entry
        return (/\d/.test(peek2())) ? readNumber() : makeToken(tPunc, next());
      },
    
      stringRe= {
        '"': /^(([^\\]*?|(\\.))*?)"/,
        "'": /^(([^\\]*?|(\\.))*?)'/
      },
    
      readString= function() {
        var 
          quote= next(),
          match= text.substring(col).match(stringRe[quote]);
        if (!match) {
          throw new error(line, col, "unterminated string");
        } else {
          col+= match[1].length + 1;
          return makeToken(tString, match[1]);
        }
      },
    
      readLineComment= function() {
        var comment= text.substring(col);
        col= text.length;
        var result= makeToken(tLineComment, comment);
        advanceLine();
        return result;
      },
    
      readBlockComment= function() {
        var comment= "/*";
        col+= 2;
        while (line<lineCount) {
          var match= text.substring(col).match(/^((.*?)\*\/)/);
          if (match) {
            comment+= match[1];
            col+= match[1].length;
            return makeToken(tBlockComment, comment);
          }
          comment+= (col ? text.substring(col) : text) + "\n";
          advanceLine();
        }
        throw new error(line, col, "unexpected end-of-file while reading block comment");
      },
    
      readRegEx= function() {
        var match= text.substring(col).match(/^\/([^\\]*?|(\\.))*?\/[img]*/);
        if (match) {
          col+= match[0].length;
          return makeToken(tRegEx, match[0]);
        }
        return false;
      },
    
      operatorRe= /^((((in(stanceof)?)|(typeof)|(new)|(void)|(delete))([^a-zA-Z_\$]|$))|[^a-zA-Z_\$])/,
      readOperator= function() {
        var match= text.substring(col).match(operatorRe);
        if (match) {
          match= match[1];
          if (match.length>1 && operators[match]) {
            col+= match.length;
            return makeToken(tOperator, match);
          } else {
            // text starts with a non-alpha; let's see if it's an operator
            var i= 0, end= text.length, test;
            while (col+i<end) {
              test= text.substring(col, col + i + 1);
              if (!operators[test]) {
                break;
              }
              i++;
            }
            if (i) {
              col+= i;
              return makeToken(tOperator, test.substring(0, i));
            }
          }
        }
        return false;
      },
    
      handleSlash= function() {
        var c= peek2();
        if (c=="/") {
          return readLineComment();
        } else if (c=="*") {
          return readBlockComment();
        }
        return (regExAllowed && (readRegEx() || readOperator())) || readOperator();
      },
    
      readWord= function() {
        var match= text.substring(col).match(/^[\w\$]+/);
        if (match) {
          match= match[0];
          col+= match.length;
          if (!keywords.propertyIsEnumerable(match)) {
            return makeToken(tName, match);
          } else if (operators.propertyIsEnumerable(match)) {
            return makeToken(tOperator, match);
          } else {
            return makeToken(tKeyword, keywords[match]);
          }
        }
        throw new error(line, col, "expected identifier");
      },
    
      nextToken= function() {
        skipWhitespace();
        startLine= line;
        startCol= col;
        var nextChar= peek();
        if (!nextChar) {
          return makeToken(tEof, "EOF");
        } else if (/\d/.test(nextChar)) {
          return readNumber();
        } else if (/['"]/.test(nextChar)) {
          return readString();
        } else if (/[\[\]\{\}\(\),;\:]/.test(nextChar)) {
          return makeToken(tPunc, next());
        } else if (nextChar==".") {
          return handleDot();
        } else if (nextChar=="/") {
          return handleSlash();
        } else {
          var result= readOperator();
          if (result) {
            return result;
          }
          if (/[a-zA-Z_\$]/.test(nextChar)) {
            return readWord();
          }
          throw new error(line+1, col, "unexpected token");
        }
      };
  
    try {
      advanceLine();
      while (1) {
        result.push((t= nextToken()));
        if (t.type===tEof) {
          return result;
        }
      }
    } catch (e) {
      console.log(e.message);
      return 0;
    }
  };

return tokenize;

});
