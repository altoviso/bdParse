//
// This program uses bdParse to determine all AMD dependencies for a set of Javascript resources. The 
// program also demonstrates a basic template for loading AMD modules in a node.js program using bdLoad.
//
// The program processes all .js files that exist in a file hierarchy rooted as a location given by
// the command line argument "root", excluding all files that have "/nls/" in their path (typically, these
// are i18n bundles). Processing includes...
// 
//	 * reading the resource
//	 * using bdParse to convert the resource contents into an AST
//	 * traversing the AST, looking for applications of the function define, and then traversing
//		 the argument tree for any such applications to find the AMD module name and dependencies.
// 
// The program is constructed as follows:
// 
//	 1. bdLoad is instantiated and initialized; it is used to load AMD modules within node.
//	 2. the command line is processed
//	 3. the "find" program is used to traverse the file hierarchy given by the command line
//	 4. Each candidate resource in the heirarchy is read, parsed, and the resulting AST traversed to
//			find and AMD dependencies. All module identifiers and found dependencies are tracked in the
//			variable deps;
//	 5. deps is traversed for each module, writing the discovered dependency tree to stdout. Note: the tree
//			is not fully traversed since this gets tedious for a real program; instead, when a dependency is encountered
//			for the *second* time it is prefixed with a "^", directing the user's attention to a previous dump of the
//			particular module's dependency tree. Any circular dependencies are noted by adding "**" after the name.
// 
// Two command line arguments are recognized:
// 
//	 * "--root" or "-r": the root of the file hierarchy to traverse
//	 * "--name" 0r "-n": the package name (if any) assumed to reside at root
// 
// For example, from the bdParse/demo/trace-deps-tree directory, issuing the command
// 
// node main.js -r ~/dev/bdParse/lib -n bdParse
//
// will result in the following output:
// 
//		bdParse/tokenize
//				bdParse/types
//		bdParse/types
//		bdParse/asn
//				bdParse/types
//		bdParse/main
//				bdParse/types
//				bdParse/tokenize
//						bdParse/types
//				bdParse/parse
//						bdParse/types
//						bdParse/asn
//								bdParse/types
//				bdParse/asn
//						bdParse/types
//		bdParse/parse
//				bdParse/types
//				bdParse/asn
//						bdParse/types
//		bdParse/dump
//				bdParse/types
//				bdParse/asn
//						bdParse/types
//
//


// load, instantiate, and configure bdLoad
var loader= require("../../../bdLoad/lib/node").boot({
	baseUrl:__dirname + "/../../../",

	packages: [{
		name:"bdParse"
	},{
		name:"traceDeps",
		location:"bdParse/demo/trace-deps-tree",
		lib:"."
	}]
});

// process the command line to get the root of the directory tree to traverse
var
	// the root directory to traverse
	root,

	// the name of the hierarchy rooted at root
	name= "",

	illegalArgumentValue= function(name, pos) {
		return new Error("Expected argument value for " + name);
	};
for (var argv= process.argv, arg, i= 2, end= argv.length; i<end;) {
	arg= argv[i++];
	switch (arg) {
		case "-r":
		case "--root":
			if (i<end) {
				root= argv[i++];
			} else {
				throw illegalArgumentValue("root", i);
			}
			break;

		case "-n":
		case "--name":
			if (i<end) {
				name= argv[i++] + "/";
			} else {
				throw illegalArgumentValue("name", i);
			}
			break;
	}
}

/*
var noFindTest= [
"../../lib/tokenize.js",
"../../lib/types.js",
"../../lib/asn.js",
"../../lib/main.js",
"../../lib/parse.js",
"../../lib/dump.js"
];
*/

loader.require(["bdParse", "traceDeps/trace"], function(bdParse, trace) {
		// execute find <root> -name "*.js" -and -not -path "*/nls/*"
		var 
			findResult= "",
			errorMessage= "",
			find= require("child_process").spawn("find", [root, "-name", "*.js", "-and", "-not", "-path", "*/nls/*"]);

		// gather output into findResult
		find.stdout.on('data', function (data) {
			findResult+= data.toString("ascii");
		});

		// gather error outputint errorMessage
		find.stderr.on('data', function (data) {
			errorMessage+= data.toString("ascii");
		});

		// upon completion of find command...
		find.on("exit", function(code, signal) {
			if (code) {
				console.log("Failed to find source files; find error:\n" + errorMessage);
				return;
			}

			// for each filename found, read the file contents and do deps tracing; keep results in modules
			var
				pathLength= root.length + 1, 
				modules= {};
			bdParse.split(findResult).forEach(function(filename) {
			//noFindTest.forEach(function(filename) {
				if (filename.length) {
					var text= require("fs").readFileSync(filename, "utf8");
					if (text) {
						trace(text, name + filename.substring(pathLength).replace(/\.js$/, ""), modules);
					} else {
						console.log("Unable to read " + filename);
					}
				}
			});

			// for each module; traverse the discovered dependency tree and dump the results to stdout
			var
				seen, visited,
				write= process.stdout.write,
				dump= function(module, indent) {
					if (indent.length) {
						process.stdout.write(indent + module + "\n");
					} else {
						process.stdout.write(module + ":\n");
					}
					seen[module]= visited[module]= 1;
					modules[module] && modules[module].forEach(function(mid) {
						if (visited[mid]) {
							process.stdout.write(indent + "		 " + mid + "**\n");
						} else if (seen[mid]) {
							process.stdout.write(indent + "		^" + mid + "\n");
						} else {
							dump(mid, indent + "		");
						}
					});
					delete visited[module];
				};
			for (var p in modules) {
				seen= {};
				visited= {};
				dump(p, "");
			}
		});
});
