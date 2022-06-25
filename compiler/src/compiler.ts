import * as babel from "@babel/core";
import { parse } from '@babel/parser';

// Compiler is in charge of compiling the specified javascript code into raw bytecode
// Compiler will first construct a basic IR 
export class Compiler {
    ast: babel.types.File

    constructor(src: string) {
        this.ast = parse(src)
    }

    private constructIR() {
        for (var i=0; i < this.ast.program.body.length; i++) {
            var node = this.ast.program.body[i]

            switch (node.type) {
                
            }
            console.log(node)
        }
     
    }
    compile() {
        
        this.constructIR()


    }
}


