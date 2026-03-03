export default function TestPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Tailwind Test</h1>
                <p className="text-gray-600 mb-4">If you see colors and styling, Tailwind is working!</p>
                <button className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                    Test Button
                </button>
            </div>
        </div>
    )
}
