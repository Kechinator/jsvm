## JSVM

- A simple javascript virtualization obfuscation implementation
- Custom stack based RSIC virtual machine in javascript
- Compiler to compile javascript into jsvm's bytecode
- 24 Supported opcodes


## Compilation Process

1) JSVM's IR compiler will first construct a intermediate representation of the provided source code
2) JSVM's Bytecode compiler will then compile the intermediate representation into binary that JSVM will understand

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
