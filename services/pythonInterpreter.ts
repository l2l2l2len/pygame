
import { ExecutionResult } from '../types';

/**
 * A safe, restricted Python-like interpreter for educational purposes.
 * This handles basic assignments, list methods, print statements, and simple control flow.
 */
export const executePythonMock = (code: string): ExecutionResult => {
  let output = '';
  const lines = code.split('\n');
  const scope: Record<string, any> = {};

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.includes('???')) {
        throw new Error(`SyntaxError: Unresolved placeholder on line ${i + 1}. All voids must be filled.`);
      }

      // 1. Variable Assignment (e.g., x = 5, y = "hello")
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.*)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valExpr = assignMatch[2];
        scope[varName] = simpleEval(valExpr, scope);
        continue;
      }

      // 2. List Methods (e.g., list.append('item'))
      const listMethodMatch = trimmed.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\((.*)\)$/);
      if (listMethodMatch) {
        const listName = listMethodMatch[1];
        const methodName = listMethodMatch[2];
        const argExpr = listMethodMatch[3];
        
        if (scope[listName] === undefined) throw new Error(`NameError: name '${listName}' is not defined.`);
        if (!Array.isArray(scope[listName])) throw new Error(`AttributeError: '${typeof scope[listName]}' object has no attribute '${methodName}'`);
        
        if (methodName === 'append') {
            scope[listName].push(simpleEval(argExpr, scope));
        } else {
            throw new Error(`AttributeError: List has no method '${methodName}' in this simulator.`);
        }
        continue;
      }

      // 3. Print Function
      const printMatch = trimmed.match(/^print\((.*)\)$/);
      if (printMatch) {
        const expression = printMatch[1].trim();
        const result = simpleEval(expression, scope);
        output += (result === undefined ? 'None' : String(result)) + '\n';
        continue;
      }

      // 4. Simple 'if' statement (single line block support)
      if (trimmed.startsWith('if ')) {
        const conditionMatch = trimmed.match(/if\s+(.*):/);
        if (!conditionMatch) throw new Error(`SyntaxError: Invalid 'if' syntax on line ${i+1}`);
        const condition = conditionMatch[1];
        
        if (evaluateCondition(condition, scope)) {
            // Check next line for an indented block
            const nextLine = lines[i + 1];
            if (nextLine && (nextLine.startsWith('    ') || nextLine.startsWith('\t'))) {
               // Executing the indented line
               const innerResult = executePythonMock(nextLine.trim());
               if (innerResult.success) output += innerResult.output + (innerResult.output ? '\n' : '');
               else throw new Error(innerResult.error);
            }
        }
        i++; // Skip the block line
        continue;
      }

      // 5. Simple 'for' loop (heads example)
      if (trimmed.startsWith('for ')) {
          const forMatch = trimmed.match(/for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*):/);
          if (!forMatch) throw new Error(`SyntaxError: Invalid 'for' syntax on line ${i+1}`);
          const iteratorVar = forMatch[1];
          const listVar = forMatch[2];
          
          const list = scope[listVar];
          if (!Array.isArray(list)) throw new Error(`TypeError: '${typeof list}' object is not iterable`);
          
          const nextLine = lines[i + 1];
          if (nextLine && (nextLine.startsWith('    ') || nextLine.startsWith('\t'))) {
              list.forEach(item => {
                  scope[iteratorVar] = item;
                  const innerResult = executePythonMock(nextLine.trim());
                  if (innerResult.success) output += innerResult.output + (innerResult.output ? '\n' : '');
                  else throw new Error(innerResult.error);
              });
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
  
  // Logical 'and'
  if (condition.includes(' and ')) {
      const parts = condition.split(' and ');
      return evaluateCondition(parts[0], scope) && evaluateCondition(parts[1], scope);
  }

  // Equality
  if (condition.includes(' == ')) {
    const [left, right] = condition.split(' == ').map(s => s.trim());
    return simpleEval(left, scope) === simpleEval(right, scope);
  }

  // Membership
  if (condition.includes(' in ')) {
      const [val, list] = condition.split(' in ').map(s => s.trim());
      const v = simpleEval(val, scope);
      const l = scope[list];
      return Array.isArray(l) && l.includes(v);
  }

  return !!simpleEval(condition, scope);
};

const simpleEval = (expr: string, scope: Record<string, any>): any => {
    expr = expr.trim();
    if (scope[expr] !== undefined) return scope[expr];
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    if (!isNaN(Number(expr))) return Number(expr);
    
    // Strings
    if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
        return expr.slice(1, -1);
    }
    
    // Lists
    if (expr.startsWith('[') && expr.endsWith(']')) {
        return expr.slice(1, -1).split(',').map(s => simpleEval(s.trim(), scope));
    }
    
    // Built-in functions
    if (expr.startsWith('len(') && expr.endsWith(')')) {
        const inner = expr.slice(4, -1);
        const list = scope[inner];
        if (Array.isArray(list)) return list.length;
        throw new Error(`TypeError: object of type '${typeof list}' has no len()`);
    }
    
    return expr;
};
