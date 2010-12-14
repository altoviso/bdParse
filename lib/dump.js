///
// \module bdParse.dump
//
// This module defines bdParse.dump.
//
define(["./types"], function(types) {

var symbols= types.symbols;

symbols["asntComment"].dump= function(children) {
  return {comment: children.value};
};

symbols["asntLabel"].dump= function(children) {
  return {label: children[0].value, statement: dump(children[1])};
};

symbols["asntBlock"].dump= function(children) {
  return {block: children.map(dump)};
};

symbols["asntSwitch"].dump= function(children) {
  return {switch: dump(children[0]), cases: children[1].map(dump)};
};

symbols["asntCase"].dump= function(children) {
  return {case: dump(children)};
};

symbols["asntDefault"].dump= function(children) {
  return {default: 1};
};

symbols["asntDebugger"].dump= function(children) {
  return {debugger: 1};
};

symbols["asntDo"].dump= function(children) {
  return {do: dump(children[0]), body: dump(children[1])};
};

symbols["asntReturn"].dump= function(children) {
  return {return: dump(children)};
};

symbols["asntThrow"].dump= function(children) {
  return {throw: dump(children)};
};

symbols["asntVar"].dump= function(children) {
  return {var: children.map(function(item) {
                              if (item.initialValue) {
                                return {name:item.name};
                              } else {
                                return {name:item.name, value:item.initialValue};
                              }
                            })};
};

symbols["asntWhile"].dump= function(children) {
  return {while: dump(children[0]), statement: dump(children[1])};
};

symbols["asntWith"].dump= function(children) {
  return {while: dump(children[0]), statement: dump(children[1])};
};

symbols["asntStatement"].dump= function(children) {
  return {statement: dump(children)};
};

symbols["asntBreak"].dump= function(children) {
  return {break:1};
};

symbols["asntContinue"].dump= function(children) {
  return {continue:1};
};

symbols["asntForIn"].dump= function(children) {
  return {forIn: children[1], object:dump(children[2]), statement:dump(children[3])};
};

symbols["asntFor"].dump= function(children) {
  return {for: 1, init:dump(children[1][0]), test:dump(children[2][0]), step:dump(children[3]), statement:dump(children[4])};
};

symbols["asntFunctionDef"].dump= function(children) {
  return {function:children[0], params:children[1].map(function(item){return item[0];}), body:children[2]};
};

symbols["asntFunctionLiteral"].dump= function(children) {
  return {function:children[0], params:children[1].map(function(item){return item[0];}), body:children[2]};
};

symbols["asntIf"].dump= function(children) {
  return {if:dump(children[0]), whenTrue:dump(children[1]), whenFalse:dump(children[2])};
};

symbols["asntTry"].dump= function(children) {
  return {try:body(children[0]), catchName:dump(children[1]), catchBody:dump(children[2]), finallyBody:dump(children[3])};
};

symbols["asntExprList"].dump= function(children) {
  return {expressionList:children.map(dump)};
};

symbols["asntNew"].dump= function(children) {
  if (children.length>1) {
    return {new:dump(children[0]), args:children[1].map(dump)};
  } else {
    return {new:dump(children[0])};
  }
};

symbols["asntUnaryPostfix"].dump= function(children) {
  return ({}[children[0]]= dump(children[1]));
};

symbols["asntUnaryPrefix"].dump= function(children) {
  return ({}[children[0]]= dump(children[1]));
};

symbols["asntArray"].dump= function(children) {
  return {array:children.map(dump)};
};

symbols["asntObject"].dump= function(children) {
  return {object:children.map(function(item) {return {name:dump(item[0]), value:dump(item[1])};})};
};

symbols["asntName"].dump= function(children) {
  return {name:children.value};
};

symbols["asntNumber"].dump= function(children) {
  return {number:children.value};
};

symbols["asntString"].dump= function(children) {
  return {string:children.value};
};

symbols["asntRegEx"].dump= function(children) {
  return {regEx:children.value};
};

symbols["asntAtom"].dump= function(children) {
  return {atom:children.value};
};

symbols["asntBinaryOp"].dump= function(children) {
  return ({}[children[0]]= [dump(children[1]), (children[0]=="(" ? children[2].map(dump) : dump(children[2]))]);
};

symbols["asntConditional"].dump= function(children) {
  return {conditional:dump(children[0]), whenTrue:dump(children[1]), whenFalse:dump(children[2])};
};

symbols["asntRoot"].dump= function(children) {
  return {root:children.map(dump)};
};

var dump= function(tree) {
  if (!tree) {
    return 0;
  }
  if (tree instanceof Array && tree.length==0) {
    return tree;
  }
  try {
    return tree.type.dump(tree.children);
  } catch (e) {
    console.log(tree);
    return {error: "dump doesn't understand this node"};
  }
};

return dump;

});
