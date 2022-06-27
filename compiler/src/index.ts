import fs from 'fs'
import { BytecodeCompiler } from './bytecode'
import { Compiler } from './compiler'



const src = fs.readFileSync('./input/basic/test.js').toString()


const compiler = new Compiler(src)
const ir = compiler.compile()

const bytecodeCompiler = new BytecodeCompiler(ir)
const vmArguments = bytecodeCompiler.compile()


console.log(vmArguments)
fs.writeFileSync('./input/basic/test.args', JSON.stringify(vmArguments, null, 4))
fs.writeFileSync('./input/basic/test.jsvm', JSON.stringify(ir, null, 4))