/**
 * Calcula as pontuações para cada dimensão com base nas respostas do usuário.
 * Esta versão inclui validações robustas para garantir que o cálculo seja sempre seguro.
 * @param {Record<string, number>} answers - Um objeto com IDs de perguntas como chaves e pontuações como valores.
 * @param {Array<{id: string, text: string, module: string}>} questions - A lista de perguntas que foi apresentada ao usuário.
 * @returns {Record<string, number> | null} Um objeto com as pontuações calculadas para cada módulo ou nulo se os dados forem inválidos.
 */
export function calculateScores(answers, questions) {
    // Validação robusta dos dados de entrada
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0 || !Array.isArray(questions) || questions.length === 0) {
        console.error("[quizLogic] Dados de entrada inválidos para calculateScores: ", { answers, questions });
        return null;
    }
    
    const initialScores = { Foco: 0, Adaptabilidade: 0, AgressorRotina: 0, MatadorDragoes: 0, RadarSocial: 0 };
    
    // Conta quantas perguntas de cada módulo foram realmente feitas
    const questionsPerModule = questions.reduce((acc, q) => {
        if (q && q.module) {
            acc[q.module] = (acc[q.module] || 0) + 1;
        }
        return acc;
    }, {});

    // Soma as pontuações das respostas para cada módulo
    const calculatedScores = Object.entries(answers).reduce((acc, [questionId, score]) => {
      const question = questions.find(q => q && q.id === questionId);
      if (question && question.module && typeof score === 'number') {
        acc[question.module] = (acc[question.module] || 0) + score;
      }
      return acc;
    }, { ...initialScores }); // Começa com uma cópia de initialScores para garantir que todos os módulos existam
    
    // Normaliza as pontuações para uma escala de 0 a 100
    for (const key in calculatedScores) {
        const moduleKey = key;
        const totalQuestionsInModule = questionsPerModule[moduleKey];
        
        // A pontuação máxima possível para um módulo é (número de perguntas * 5)
        const maxScorePossible = totalQuestionsInModule * 5;

        if (totalQuestionsInModule > 0 && maxScorePossible > 0) {
           calculatedScores[moduleKey] = Math.round((calculatedScores[moduleKey] / maxScorePossible) * 100);
        } else {
            // Se não houver perguntas para um módulo, a pontuação é 0
            calculatedScores[moduleKey] = 0;
        }
    }

    return calculatedScores;
}
