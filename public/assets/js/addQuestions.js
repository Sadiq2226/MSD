function addQuestion() {
    const questionsContainer = document.querySelector('.questions-container');

    // Create a new question div
    const newQuestionDiv = document.createElement('div');
    newQuestionDiv.className = 'question';

    // Create input fields for the question and answer
    const questionInput = document.createElement('input');
    questionInput.type = 'text';
    questionInput.name = 'questions[]';
    questionInput.placeholder = `Question ${questionsContainer.children.length + 1}`;
    questionInput.required = true;

    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.name = 'answers[]';
    answerInput.placeholder = `Answer ${questionsContainer.children.length + 1}`;
    answerInput.required = true;

    // Append inputs to the new question div
    newQuestionDiv.appendChild(questionInput);
    newQuestionDiv.appendChild(answerInput);

    // Append the new question div to the questions container
    questionsContainer.appendChild(newQuestionDiv);
}
