isEmpty= function(it) {
  for (var p in it) return false;
  return true;
};
var qlc = (d._NodeListCtor = 		d.NodeList);
switch(evt.type){
	case "keypress":
		del._setKeyChar(evt);
		break;
}
result[0] = base ?
	base._meta && base === result[result.length - base._meta.bases.length] ?
		base._meta.bases.length : 1 : 0;
for(; i < l; ++i){
}
dojo.extend = function(/*Object*/ constructor, /*Object...*/ props){
	// summary:
	//		Adds all properties and methods of props to constructor's
	//		prototype, making them available to all instances created with
	//		constructor.
	for(var i=1, l=arguments.length; i<l; i++){
		dojo.mix(constructor.prototype, arguments[i]);
	}
	return constructor; // Object
};
currentPart.id = ts(inId, x).replace(/\\/g, "");
mid.toString()
  .replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "")
  .replace(/require\(["']([\w\!\-_\.\/]+)["']\)/g, function (match, dep) {
    dependencies.push(dep);
  });
a[b]= c;
x++;
(function(){})();

//conditional
a ? b : c;

//assign
a= b;

// binary expr
a + b;
a + b * c;
a * b + c;

//subscripts
a.b;
a.b.c;

//object
x= {};
x= {a:1};
x= {a:1, b:2};


//parenthesized
(a);
((a));
(a && b);
((a && b) || (c && d));

//exprList
[];
[a];
[a, b];
[a, b, c];
x();
x(a);
x(a, b);
x(a, b, c);
new x();
new x(a);
new x(a, b);
new x(a, b, c);


+a;
function x() {
}
123;
id;
/test/;
"string";
x(0);
x[0];
{x;};

x= 1, y= 2;
if (x>y && y>z) {
  x= 1;
} else {
  y= 2;
}


