import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function TestCases() {
    const router = useRouter()
    useEffect(() => {
        const sampleMCQ = JSON.stringify([
            {
                question: 'What is the powerhouse of the cell?',
                options: ['A) Nucleus', 'B) Mitochondria', 'C) Ribosome', 'D) Golgi apparatus'],
                answer: 'B',
                explanation: 'Mitochondria produce ATP through cellular respiration.',
            },
            {
                question: 'Which gas do plants absorb during photosynthesis?',
                options: ['A) Oxygen', 'B) Nitrogen', 'C) Carbon dioxide', 'D) Hydrogen'],
                answer: 'C',
                explanation: 'Plants use CO₂ and sunlight to produce glucose.',
            },
            {
                question: "What is Newton's first law of motion?",
                options: [
                    'A) F = ma',
                    'B) Action equals reaction',
                    'C) Objects in motion stay in motion unless acted upon',
                    'D) Energy cannot be created',
                ],
                answer: 'C',
                explanation: 'Also known as the law of inertia.',
            },
        ])
        router.push({
            pathname: '/Results',
            params: { type: 'mcq', content: sampleMCQ },
        })
    }, [])
}
    