import Editor from "@monaco-editor/react"

function QuestionRenderer({ question, value, onChange })
{
    if (!question) {
        return null;
    }

    //
    // MCQ
    //
    if (question.type === "mcq")
    {
        return (
            <div>

                <h2 className="text-2xl font-semibold leading-relaxed">
                    {question.questionText}
                </h2>

                <div className="mt-8 space-y-4">

                    {
                        question.options.map((option, idx) => (

                            <label
                                key={idx}
                                className={`
                                    flex items-center gap-4
                                    border rounded-2xl p-5 cursor-pointer transition
                                    ${Number(value) === idx
                                        ? "border-white bg-zinc-900"
                                        : "border-zinc-800 bg-zinc-950"
                                    }
                                `}
                            >

                                <input
                                    type="radio"
                                    checked={Number(value) === idx}
                                    onChange={() => onChange(idx)}
                                />

                                <span>
                                    {option}
                                </span>

                            </label>
                        ))
                    }

                </div>

            </div>
        )
    }

    //
    // THEORY
    //
    if (question.type === "theory")
    {
        return (
            <div>

                <h2 className="text-2xl font-semibold leading-relaxed">
                    {question.questionText}
                </h2>

                <textarea
                    rows={10}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Write your answer here..."
                    className="
                        mt-8 w-full bg-zinc-950 border border-zinc-800
                        rounded-2xl p-5 outline-none resize-none overflow-y-auto
                    "
                />

            </div>
        )
    }

    //
    // CODING
    //
    return (
        <div>
            <h2 className="text-2xl font-semibold leading-relaxed">
                {question.questionText}
            </h2>

            <div className="
                mt-8 overflow-hidden
                border border-zinc-800 rounded-2xl
            ">

                <Editor
                    height="500px"
                    defaultLanguage="cpp"
                    theme="vs-dark"
                    value={value || ""}
                    onChange={(val) => onChange(val || "")}
                    options={{
                        minimap: {
                            enabled: false
                        },

                        fontSize: 14,

                        wordWrap: "on",

                        scrollBeyondLastLine: false,

                        automaticLayout: true,

                        quickSuggestions: false,

                        suggestOnTriggerCharacters: false,

                        parameterHints: {
                            enabled: false
                        },

                        hover: {
                            enabled: false
                        },

                        contextmenu: false,

                        folding: false,

                        glyphMargin: false,

                        lineNumbersMinChars: 3,

                        renderLineHighlight: "none",

                        occurrencesHighlight: "off",

                        selectionHighlight: false,

                        codeLens: false,

                        links: false,

                        matchBrackets: "always",

                        autoClosingBrackets: "always",

                        autoClosingQuotes: "always",

                        autoIndent: "advanced",

                        formatOnPaste: false,

                        formatOnType: false
                    }}
                />

            </div>

        </div>
    )
}

export default QuestionRenderer;