define(["bdParse"], function(bdParse) {
//
// This module defines the function trace which takes three arguments:
//	 text:		the contents of a Javascript resource
//	 mid:			the module identifier associated with that resource
//	 modules: a map from module identifier to vector of dependencies
// 
// Trace parses text with bdParse and then traverses the returned AST to find all AMD define applications. Each define
// application is decoded to determine the module identifier and dependency list; the module argument is augmented 
// accordingly. The algorithm to do this work is almost trivial!
//
// Each AST node is a Javascript object constructed by the constructor at bdParse.asn. Each of these objects
// contains a "type" property which is a symbol that gives the type of the node, together with other node-type-dependent
// information. All of the possible node types are listed below. The precise structure of each node can be found in
// bdParse/asn.
// 
// symbols are simple Javascript objects that guarantee the following property:
// 
//	 bdParse.symbols[<name>].value==<name>
// 
// bdParse, uses this construct to simulate a first class symbol type that is found in other languages (e.g., lisp). 
// With care, you can add properties to symbol objects to do interesting things; this routine is an example.
// 
// This routine adds the method "amdAstProc" to each symbol, and that method gives the process to execute when
// a node with the particular symbol type is encountered. The processes described below simply traverse the AST. If/when
// a function application ASN is encountered (symbol type "asnBinaryOp", with an asn value of "("), the asn is further
// inspected to see if the function name being applied is "define". If so, the asn is fully decoded to find the dependency
// list.
//
var 
	symbols= bdParse.symbols,
	asnComment= symbols["asnComment"],
	asnLabel= symbols["asnLabel"],
	asnBlock= symbols["asnBlock"],
	asnSwitch= symbols["asnSwitch"],
	asnCase= symbols["asnCase"],
	asnDefault= symbols["asnDefault"],
	asnDebugger= symbols["asnDebugger"],
	asnDo= symbols["asnDo"],
	asnReturn= symbols["asnReturn"],
	asnThrow= symbols["asnThrow"],
	asnVar= symbols["asnVar"],
	asnWhile= symbols["asnWhile"],
	asnWith= symbols["asnWith"],
	asnStatement= symbols["asnStatement"],
	asnBreak= symbols["asnBreak"],
	asnContinue= symbols["asnContinue"],
	asnForIn= symbols["asnForIn"],
	asnFor= symbols["asnFor"],
	asnFunctionDef= symbols["asnFunctionDef"],
	asnFunctionLiteral= symbols["asnFunctionLiteral"],
	asnIf= symbols["asnIf"],
	asnConditional= symbols["asnConditional"],
	asnTry= symbols["asnTry"],
	asnExprList= symbols["asnExprList"],
	asnNew= symbols["asnNew"],
	asnUnaryPrefix= symbols["asnUnaryPrefix"],
	asnUnaryPostfix= symbols["asnUnaryPostfix"],
	asnBinaryOp= symbols["asnBinaryOp"],
	asnArray= symbols["asnArray"],
	asnObject= symbols["asnObject"],
	asnName= symbols["asnName"],
	asnNumber= symbols["asnNumber"],
	asnString= symbols["asnString"],
	asnRegEx= symbols["asnRegEx"],
	asnAtom= symbols["asnAtom"],
	asnRoot= symbols["asnRoot"],

	amdAstProc= function() {
		// usually each argument is a asn object; run amdAstProc for each argument
	 //	 that has such a method hung off its type property.
		for (var arg, result= 1, i= 0; i<arguments.length; i++) {
			arg= arguments[i];
			if (arg && arg.type && arg.type.amdAstProc) {
				result= arg.type.amdAstProc(arg.children, arg) && result;
			}
		}
		return result;
	},

	// the mid and modules being worked on during a single trace call
	theMid, theModules;

	asnComment.amdAstProc=
	asnDefault.amdAstProc=
	asnDebugger.amdAstProc=
	asnVar.amdAstProc=
	asnBreak.amdAstProc=
	asnContinue.amdAstProc=
	asnName.amdAstProc=
	asnNumber.amdAstProc=
	asnString.amdAstProc=
	asnRegEx.amdAstProc=
	asnAtom.amdAstProc= 0;
	
	asnLabel.amdAstProc=
		function(children) {
			amdAstProc(children[1]);
		};
		
	asnBlock.amdAstProc=
	asnDo.amdAstProc=
	asnWhile.amdAstProc=
	asnWith.amdAstProc=
	asnForIn.amdAstProc=
	asnFor.amdAstProc=
	asnIf.amdAstProc=
	asnConditional.amdAstProc=
	asnTry.amdAstProc=
	asnExprList.amdAstProc=
	asnNew.amdAstProc=
	asnUnaryPrefix.amdAstProc=
	asnUnaryPostfix.amdAstProc=
	asnArray.amdAstProc=
	asnRoot.amdAstProc=
		function(children) {
			amdAstProc.apply(this, children);
		};
	
	asnSwitch.amdAstProc=
		function(children) {
			amdAstProc(children[0]);
			amdAstProc.apply(this, children[1]);
		};
	
	asnCase.amdAstProc=
	asnReturn.amdAstProc=
	asnThrow.amdAstProc=
	asnStatement.amdAstProc=
		function(children) {
			amdAstProc(children);
		};
	
	asnFunctionDef.amdAstProc=
	asnFunctionLiteral.amdAstProc=
		function(children) {
			amdAstProc.apply(this, children[2]);
		};
	
	asnObject.amdAstProc=
		function(children) {
			for (var i= 0, end= children.length; i<end; i++) {
				amdAstProc(children[i][1]);
			}
		};

	function fixMid(dep, reference) {
		if (/^\./.test(dep)) {
			dep= reference + "/../" + dep;
			while (/\/\.\//.test(dep)) dep= dep.replace("/./", "/");
			var match;
			while ((match= dep.match(/^(.*\/)?[^\/]+\/\.\.\/(.*)$/))) {
				dep= (match[1] ? match[1] : "") + match[2];
			}
		}
		return dep;
	}

	// below we discover the mid and deps. It is possible that these are not constant strings, in which
	// case we just punt in that case and return "<computed>".
	
	function getDeps(mid, exprList) {
		if (mid) {
			// mid is not implied; therefore, if its a constant string, figure it out...
			if (mid.type==asnString) {
				mid= mid.children.value;
			} else {
				// it's not constant; therefore...
				mid= "<computed>";
			}
		} else {
			mid= theMid;
		}
		var deps= theModules[mid] || (theModules[mid]= []);
		for (var i= 0; i<exprList.length; i++) {
			var item= exprList[i];
			if (item.type===asnString) {
				var dep= exprList[i].children.value;
				if (!(/(require)|(export)|(module)/.test(dep))) {
					deps.push(fixMid(dep, mid));
				}
			} else {
				// a dependency was not a constant string...
				deps.push("<computed>");
			}
		}
	}
	
	asnBinaryOp.amdAstProc=
		function(children) {
			if (children[0].value=="(") {
				// binaryOp with value of "(" is operator apply
				// children[1] is the function name (an expr)
				// children[2] is the function args (an array of expr)
				var
					name= children[1],
					args= children[2];
				if (name.type===asnName && name.children.value=="define") {
					// applying define; this is what we're looking for				 
					if (args.length==1) {
						// module name is implied by resource name; no dependencies given; args[0] holds the factory
					} else if (args.length==2 && args[0].type===asnArray) {
						// module name is implied by resource name; args[0] holds dependencies; args[1] holds the factory
						getDeps(0, args[0].children);
					} else if (args.length==2 && args[0].type===asnString) {
						// module name is given by args[0]; dependencies is missing; args[1] holds the factory
					} else if (args.length==3) {
						// module name is given by args[0]; dependencies by args[1]; factory by args[2]
						getDeps(args[0], args[1].children);
					} 
				} else if (name.type===asnName && name.children.value=="require") {
					// args[0] is always the dependency vector and args[1] the factory
					getDeps(args[0].children);
				}
			} else {
				amdAstProc(children[1], children[2]);
			}
		};

	return function(text, mid, modules) {
		// publish mid and modules to our process, above
		// (note: we could just do a big closure, but then we'd have to make all those assignments every time)
		theMid= mid;
		theModules= modules;
		try {
			var tree= bdParse.parseText(text)[1];
			amdAstProc.apply(this, tree.children);
		} catch (e) {
			console.log("failed to parse " + mid + "(" + e.message + ")");
		}
	};
});
