
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

      // Handle list method .append()
      const listAppendMatch = trimmed.match(/^([a-zA-Z_]\w*)\.append\((.*)\)$/);
      if (listAppendMatch) {
        const listName = listAppendMatch[1];
        const valExpr = listAppendMatch[2];
        if (Array.isArray(scope[listName])) {
          scope[listName].push(simpleEval(valExpr, scope));
        }
        continue;
      }

      // Handle simple cast() simulation
      const castMatch = trimmed.match(/^cast\((.*)\)$/);
      if (castMatch) {
        const arg = castMatch[1].trim();
        const val = simpleEval(arg, scope);
        if (val === 'light') output += 'Let there be light!\n';
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

      // Handle simple if block simulation
      if (trimmed.startsWith('if ')) {
        const condition = trimmed.match(/if\s+(.*):/)?.[1];
        if (condition) {
          if (evaluateCondition(condition, scope)) {
            // Simulation: skip to indented block and execute next line
            const nextLine = lines[i + 1];
            if (nextLine && nextLine.includes('print')) {
              const msgMatch = nextLine.match(/print\(['"](.*)['"]\)/);
              if (msgMatch) output += msgMatch[1] + '\n';
            }
          }
        }
        continue;
      }

      // Handle for heads loop simulation
      if (trimmed.startsWith('for ') && trimmed.includes('in heads:')) {
          const heads = scope['heads'] || [];
          const nextLine = lines[i + 1];
          if (nextLine && nextLine.includes('print')) {
              const msgMatch = nextLine.match(/print\(['"](.*)['"]\)/);
              if (msgMatch) {
                  heads.forEach(() => {
                      output += msgMatch[1] + '\n';
                  });
              }
          }
          i++; // Skip the next line as we just simulated it
          continue;
      }
    }

    return { output: output.trim(), success: true };
  } catch (error: any) {
    return { output, success: false, error: error.message };
  }
};

const evaluateCondition = (condition: string, scope: Record<string, any>): boolean => {
  // Simple check for boolean variables
  if (scope[condition.trim()] !== undefined) return !!scope[condition.trim()];
  
  // Orb check
  if (condition.includes('and')) {
      const parts = condition.split('and');
      return evaluateCondition(parts[0], scope) && evaluateCondition(parts[1], scope);
  }

  // Equality check
  if (condition.includes('==')) {
    const [left, right] = condition.split('==').map(s => s.trim());
    return simpleEval(left, scope) === simpleEval(right, scope);
  }

  // Inclusion check
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
    return expr;
};
