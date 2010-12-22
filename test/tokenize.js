define(["bdParse", "text!./tokens.txt", "dojo/json"], function(bdParse, tokens, dojo) {
  tokens= bdParse.split(tokens);
  tokens= bdParse.tokenize(tokens);
  dojo.byId("result").innerHTML= "<pre>" + dojo.toJson(tokens, true, "    ") + "</pre>";
});
