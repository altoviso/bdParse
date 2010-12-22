define(["bdParse", "text!./numbers.txt"], function(bdParse, numbers) {
  // numbers is a file with a single number on each line; it may also have some comments
  var sifted= [];
  numbers.split("\n").forEach(function(line) {
    if (!/^\s*\/\//.test(line)) {
      sifted.push(line);
    }
  });

  var text= "";
  sifted.forEach(function(line) {
    text+= line + ";\n";
  });

  console.log(bdParse.parseText(text));
  
});
