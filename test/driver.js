var unitUnderTest= "text!./atomExpr.js";
unitUnderTest= "text!/dev/bdLoad/lib/junk.js";

define(["bdParse", "bdParse/dump", unitUnderTest, "dojo/json"], function(bdParse, dump, uut, dojo) {
  try {
    // tresult is a global for inspection

    tresult= bdParse.parseText(uut);
    dojo.byId("result").innerHTML= "<pre>" + dojo.toJson(dump(tresult[1]), true, "    ") + "</pre>";
    //dojo.byId("result").innerHTML= "<pre>done</pre>";
  } catch(e) {
    console.log(e);
    debugger;
  }
});
