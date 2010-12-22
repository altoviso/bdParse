define(["bdParse", "text!./smoke.txt"], function(bdParse, smoke) {
  smoke= bdParse.split(smoke);
  var tokens= bdParse.tokenize(smoke);
  console.log(tokens);
  var tree= bdParse.parse(tokens);
  console.log(tree);
});
