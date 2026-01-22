
import { ExecutionResult } from '../types';

export const executePythonMock = (code: string): ExecutionResult => {
  let output = '';
  const lines = code.split('\n');
  const scope: Record<string, any> = {};

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Detect common syntax errors or unresolved placeholders
      if (trimmed.includes('???')) {
        throw new Error(`Placeholder detected on line ${i + 1}. All magical voids must be filled.`);
      }

      // Handle list method .append()
      const listAppendMatch = trimmed.match(/^([a-zA-Z_]\w*)\.append\((.*)\)$/);
      if (listAppendMatch) {
        const listName = listAppendMatch[1];
        const valExpr = listAppendMatch[2];
        if (scope[listName] === undefined) {
           throw new Error(`NameError: name '${listName}' is not defined.`);
        }
        if (Array.isArray(scope[listName])) {
          scope[listName].push(simpleEval(valExpr, scope));
        } else {
          throw new Error(`AttributeError: '${typeof scope[listName]}' object has no attribute 'append'`);
        }
        continue;
      }

      // Handle print()
      const printMatch = trimmed.match(/^print\((.*)\)$/);
      if (printMatch) {
        const expression = printMatch[1].trim();
        const result = simpleEval(expression, scope);
        output += (typeof result === 'object' ? JSON.stringify(result) : result) + '\n';
        continue;
      }

      // Handle variable assignment
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.*)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valExpr = assignMatch[2];
        scope[varName] = simpleEval(valExpr, scope);
        continue;
      }

      // Handle simple if block
      if (trimmed.startsWith('if ')) {
        const conditionMatch = trimmed.match(/if\s+(.*):/);
        if (!conditionMatch) throw new Error(`SyntaxError: invalid syntax in 'if' statement on line ${i+1}`);
        const condition = conditionMatch[1];
        if (evaluateCondition(condition, scope)) {
            const nextLine = lines[i + 1];
            if (nextLine && nextLine.includes('print')) {
              const msgMatch = nextLine.match(/print\(['"](.*)['"]\)/);
              if (msgMatch) output += msgMatch[1] + '\n';
            }
        }
        i++; // Skip inner block line in this simple simulator
        continue;
      }

      // Handle for loop simulation
      if (trimmed.startsWith('for ') && trimmed.includes('in heads:')) {
          const heads = scope['heads'];
          if (!heads || !Array.isArray(heads)) throw new Error(`NameError: name 'heads' is not defined or is not a list.`);
          const nextLine = lines[i + 1];
          if (nextLine && nextLine.includes('print')) {
              const msgMatch = nextLine.match(/print\(['"](.*)['"]\)/);
              if (msgMatch) {
                  heads.forEach(() => {
                      output += msgMatch[1] + '\n';
                  });
              }
          }
          i++; 
          continue;
      }
    }

    return { output: output.trim(), success: true };
  } catch (error: any) {
    return { output, success: false, error: error.message };
  }
};

const evaluateCondition = (condition: string, scope: Record<string, any>): boolean => {
  condition = condition.trim();
  if (scope[condition] !== undefined) return !!scope[condition];
  
  if (condition.includes('and')) {
      const parts = condition.split('and');
      return evaluateCondition(parts[0], scope) && evaluateCondition(parts[1], scope);
  }

  if (condition.includes('==')) {
    const [left, right] = condition.split('==').map(s => s.trim());
    return simpleEval(left, scope) === simpleEval(right, scope);
  }

  if (condition.includes(' in ')) {
      const [val, list] = condition.split(' in ').map(s => s.trim());
      const v = simpleEval(val, scope);
      const l = scope[list];
      return Array.isArray(l) && l.includes(v);
  }

  return false;
};

const simpleEval = (expr: string, scope: Record<string, any>): any => {
    expr = expr.trim();
    if (scope[expr] !== undefined) return scope[expr];
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    if (!isNaN(Number(expr))) return Number(expr);
    if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
        return expr.slice(1, -1);
    }
    if (expr.startsWith('[') && expr.endsWith(']')) {
        return expr.slice(1, -1).split(',').map(s => simpleEval(s.trim(), scope));
    }
    if (expr.startsWith('len(') && expr.endsWith(')')) {
        const inner = expr.slice(4, -1);
        const list = scope[inner];
        if (Array.isArray(list)) return list.length;
        throw new Error(`TypeError: object of type '${typeof list}' has no len()`);
    }
    return expr;
};
