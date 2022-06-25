import fs from 'fs'
import { Compiler } from './compiler'



const src = fs.readFileSync('input/basic/test.js').toString()


const compiler = new Compiler(src)
compiler.compile()