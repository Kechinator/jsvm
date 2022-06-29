## JSVM

- A simple javascript virtualization obfuscation implementation
- Custom stack based RISC virtual machine in javascript
- Compiler to compile javascript into jsvm's bytecode
- 24 Supported opcodes

The compiler only covers a subset of javascript syntax, I will be adding more over time

## Compilation Process

1) JSVM's IR compiler will first construct a intermediate representation of the provided source code
2) JSVM's Bytecode compiler will then compile the intermediate representation into binary that JSVM will understand


## Example

```js

import fs from 'fs'
import { BytecodeCompiler } from './bytecode'
import { Compiler } from './compiler'



const src = fs.readFileSync('./input/basic-browserchecks/test.js').toString()


const compiler = new Compiler(src)
const ir = compiler.compile()

const bytecodeCompiler = new BytecodeCompiler(ir)
const vmArguments = bytecodeCompiler.compile()


// console.log(vmArguments)
fs.writeFileSync('./input/basic-browserchecks/test.args', JSON.stringify(vmArguments, null, 4))
fs.writeFileSync('./input/basic-browserchecks/test.jsvm', JSON.stringify(ir, null, 4))
```

**Input JS Script**

```js


console.log("Checking Basic Browser Properties")

var appVersion = navigator.appVersion
var evalLength = eval.toString().length
// var accelerometerPermission = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'
var deviceMemory = navigator.deviceMemory
var languages = navigator.languages
var concurrency = navigator.hardwareConcurrency



console.log(appVersion, evalLength, deviceMemory, languages, concurrency)
```

**Bytecode**

```js

{
    bytecode: 'BgEAAAAAAAAAAAYVAAAAAAAAAAAAQzRpSlpkUEUYFgEBAAAAAAAAABUGFQABAAAAAAAAAHhxOUJpTnhKBxUDABUDASEVBAAVAAIAAAAAAAAAZ0lqcEo0QlUVAwAiFQQCFQADAAAAAAAAAFVraWJ4UU9lBxYBAwAAAAAAAAAGAQIAAAAAAAAAAwMGAQUAAAAAAAAABhUEAxUABAAAAAAAAABzd0Z0OTRaehUDBSIVAAUAAAAAAAAAV0ZLS082aFIHFgEGAAAAAAAAAAYBBAAAAAAAAAADBhUEAhUABgAAAAAAAABvejA3MG9JTQcWAQgAAAAAAAAABgEHAAAAAAAAAAMIFQQCFQAHAAAAAAAAAEk3RnQ0RG1pBxYBCgAAAAAAAAAGAQkAAAAAAAAAAwoVBAIVAAgAAAAAAAAAN2xuVTkyNmgHFgEMAAAAAAAAAAYBCwAAAAAAAAADDAYBDQAAAAAAAAAGFQMCGBYBDgAAAAAAAAAVBhUACQAAAAAAAABMZzE5OXRPdwcVAw0VAw4hFQMEGBYBDwAAAAAAAAAVBhUACgAAAAAAAAAwNWdpTkFqWQcVAw0VAw8hFQMHGBYBEAAAAAAAAAAVBhUACwAAAAAAAAB3cWI3MWN1SQcVAw0VAxAhFQMJGBYBEQAAAAAAAAAVBhUADAAAAAAAAABiZ2w1YWdETwcVAw0VAxEhFQMLGBYBEgAAAAAAAAAVBhUADQAAAAAAAAA4dE9OTXVQMQcVAw0VAxIhFQQAFQAOAAAAAAAAAHBhdFRrWXpqFQMNIhk=',
    encryptedStrings: [
      '\x00\\\f)1\r>"cv\b93\x07p\x071[\x1E9?\x16p\x151[\x19/(\x109 0',
      '\b\x04J*',
      '\x0B&\r',
      '4\x1B\x194\x1D#<\f:\x05',
      '\x07\x18\x15\x00K]4\x1D',
      ';#%,;^',
      '\x0B\x1FF^S\n\x04(\x02\x15BN',
      '%V(\x13A%\n\f:',
      '_\r\x1C1NSD\rt\x03\x006L@D\rY\x0F\x17',
      '<\x12BQ',
      '@@\x14\x01',
      '\x07\x04\x11_',
      '\x12\x12\x1F]',
      'H\x01<&',
      '\x1C\x0E\x13'
    ],
    lookUpTable: { '\x01\x00\x0B\x0B': 0 }
  }
```






## To-do

- Add function support
- Add dead code injection option
- Add integrity checks and domain protection
- Add dynamic map from program counter to opcodes

## Status

**WIP**

## Unsupported Javascript types

- Classes
- Async


## Sources
https://github.com/jwillbold/rusty-jsyc

https://www.usenix.org/legacy/event/woot09/tech/full_papers/rolles.pdf 

https://synthesis.to/2021/10/21/vm_based_obfuscation.html
