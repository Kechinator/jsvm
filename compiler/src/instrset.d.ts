export type LOAD_TYPES = {
    'LOAD_STRING': 0,
    'LOAD_NUMBER': 1,

    'POP_STACK': 2,
    'FETCH_VARIABLE': 3,

    'FETCH_DEPENDENCY': 4,

}
export type Opcode = 'ADD' 
    | 'SUB' 
    | 'MUL' 
    | 'DIV' 
    | 'MOD' 
    | 'NEG' 
    | 'NOT'
    | 'STORE' 
    | 'GET_PROPERTY' 
    | 'SET_PROPERTY' 
    | 'EXISTS' 
    | 'DELETE_PROPERTY' 
    | 'INSTANCE_OF' 
    | 'TYPEOF' 
    | 'CALL' 
    | 'EQUAL' 
    | 'NOT_EQUAL' 
    | 'LESS_THAN' 
    | 'LESS_THAN_EQUAL' 
    | 'JMP_IF' 
    | 'PUSH' 
    | 'POP' 
    | 'INIT_CONSTRUCTOR' 
    | 'STRICT_NOT_EQUAL'
    | 'INIT_ARRAY' 
    | 'EXIT'
    | 'APPLY'
    | 'CALL_MEMBER_EXPRESSION'
