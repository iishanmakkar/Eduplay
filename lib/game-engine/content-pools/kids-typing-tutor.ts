/**
 * Kids Typing Tutor - Complete typing education system
 * Teaches keyboard layout, hand placement, and typing technique
 */

import { Question, ContentPool } from '../content-generator'

export interface TypingLesson {
    id: string
    level: number
    title: string
    description: string
    keys: string[]
    exercises: TypingExercise[]
    handPosition: 'home' | 'top' | 'bottom' | 'numbers' | 'all'
}

export interface TypingExercise {
    id: string
    text: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    targetWPM: number
    focusKeys?: string[]
}

export class KidsTypingTutorContent {
    // Home row keys (starting position)
    static HOME_ROW = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']
    static TOP_ROW = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']
    static BOTTOM_ROW = ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    static NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

    static getLessons(): TypingLesson[] {
        return [
            // Level 1: Home Row (Foundation)
            {
                id: 'lesson-1',
                level: 1,
                title: '🏠 Home Row - The Foundation',
                description: 'Learn the home row keys: ASDF JKL;',
                keys: this.HOME_ROW,
                handPosition: 'home',
                exercises: [
                    { id: 'ex-1-1', text: 'fff jjj fff jjj', difficulty: 'EASY', targetWPM: 15, focusKeys: ['f', 'j'] },
                    { id: 'ex-1-2', text: 'ddd kkk ddd kkk', difficulty: 'EASY', targetWPM: 15, focusKeys: ['d', 'k'] },
                    { id: 'ex-1-3', text: 'sss lll sss lll', difficulty: 'EASY', targetWPM: 15, focusKeys: ['s', 'l'] },
                    { id: 'ex-1-4', text: 'aaa ;;; aaa ;;;', difficulty: 'EASY', targetWPM: 15, focusKeys: ['a', ';'] },
                    { id: 'ex-1-5', text: 'asdf jkl; asdf jkl;', difficulty: 'EASY', targetWPM: 20 },
                    { id: 'ex-1-6', text: 'sad lad fad jak', difficulty: 'MEDIUM', targetWPM: 25 },
                    { id: 'ex-1-7', text: 'a sad lad; a jak falls', difficulty: 'MEDIUM', targetWPM: 25 },
                ]
            },

            // Level 2: Top Row
            {
                id: 'lesson-2',
                level: 2,
                title: '⬆️ Top Row - Reaching Up',
                description: 'Add top row keys: QWERT YUIOP',
                keys: [...this.HOME_ROW, ...this.TOP_ROW],
                handPosition: 'top',
                exercises: [
                    { id: 'ex-2-1', text: 'fff rrr fff rrr', difficulty: 'EASY', targetWPM: 20, focusKeys: ['f', 'r'] },
                    { id: 'ex-2-2', text: 'jjj uuu jjj uuu', difficulty: 'EASY', targetWPM: 20, focusKeys: ['j', 'u'] },
                    { id: 'ex-2-3', text: 'ddd eee ddd eee', difficulty: 'EASY', targetWPM: 20, focusKeys: ['d', 'e'] },
                    { id: 'ex-2-4', text: 'kkk iii kkk iii', difficulty: 'EASY', targetWPM: 20, focusKeys: ['k', 'i'] },
                    { id: 'ex-2-5', text: 'qwer tyui qwer tyui', difficulty: 'MEDIUM', targetWPM: 25 },
                    { id: 'ex-2-6', text: 'we were there', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-2-7', text: 'the quick red fox', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-2-8', text: 'type your words here', difficulty: 'HARD', targetWPM: 35 },
                ]
            },

            // Level 3: Bottom Row
            {
                id: 'lesson-3',
                level: 3,
                title: '⬇️ Bottom Row - Reaching Down',
                description: 'Add bottom row keys: ZXCV BNM',
                keys: [...this.HOME_ROW, ...this.TOP_ROW, ...this.BOTTOM_ROW],
                handPosition: 'bottom',
                exercises: [
                    { id: 'ex-3-1', text: 'fff vvv fff vvv', difficulty: 'EASY', targetWPM: 20, focusKeys: ['f', 'v'] },
                    { id: 'ex-3-2', text: 'jjj nnn jjj nnn', difficulty: 'EASY', targetWPM: 20, focusKeys: ['j', 'n'] },
                    { id: 'ex-3-3', text: 'ddd ccc ddd ccc', difficulty: 'EASY', targetWPM: 20, focusKeys: ['d', 'c'] },
                    { id: 'ex-3-4', text: 'kkk mmm kkk mmm', difficulty: 'EASY', targetWPM: 20, focusKeys: ['k', 'm'] },
                    { id: 'ex-3-5', text: 'zxcv bnm zxcv bnm', difficulty: 'MEDIUM', targetWPM: 25 },
                    { id: 'ex-3-6', text: 'can you see me', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-3-7', text: 'the cat climbed a tree', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-3-8', text: 'mix the colors and make art', difficulty: 'HARD', targetWPM: 35 },
                ]
            },

            // Level 4: Numbers
            {
                id: 'lesson-4',
                level: 4,
                title: '🔢 Number Row - Counting Up',
                description: 'Learn number keys: 1234567890',
                keys: [...this.HOME_ROW, ...this.TOP_ROW, ...this.BOTTOM_ROW, ...this.NUMBERS],
                handPosition: 'numbers',
                exercises: [
                    { id: 'ex-4-1', text: '111 222 333 444', difficulty: 'EASY', targetWPM: 20 },
                    { id: 'ex-4-2', text: '555 666 777 888', difficulty: 'EASY', targetWPM: 20 },
                    { id: 'ex-4-3', text: '999 000 123 456', difficulty: 'MEDIUM', targetWPM: 25 },
                    { id: 'ex-4-4', text: 'I have 5 cats and 3 dogs', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-4-5', text: 'There are 10 apples in the basket', difficulty: 'HARD', targetWPM: 35 },
                ]
            },

            // Level 5: Full Keyboard Practice
            {
                id: 'lesson-5',
                level: 5,
                title: '⌨️ Full Keyboard - Master Typing',
                description: 'Practice all keys together',
                keys: [...this.HOME_ROW, ...this.TOP_ROW, ...this.BOTTOM_ROW, ...this.NUMBERS],
                handPosition: 'all',
                exercises: [
                    { id: 'ex-5-1', text: 'The quick brown fox jumps over the lazy dog', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-5-2', text: 'Pack my box with five dozen liquor jugs', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-5-3', text: 'How vexingly quick daft zebras jump', difficulty: 'MEDIUM', targetWPM: 35 },
                    { id: 'ex-5-4', text: 'The five boxing wizards jump quickly', difficulty: 'HARD', targetWPM: 35 },
                    { id: 'ex-5-5', text: 'Sphinx of black quartz judge my vow', difficulty: 'HARD', targetWPM: 40 },
                    { id: 'ex-5-6', text: 'I can type fast and accurately with practice', difficulty: 'HARD', targetWPM: 40 },
                ]
            },

            // Level 6: Fun Sentences for Kids
            {
                id: 'lesson-6',
                level: 6,
                title: '🎉 Fun Practice - Stories & Sentences',
                description: 'Type fun sentences and stories',
                keys: [...this.HOME_ROW, ...this.TOP_ROW, ...this.BOTTOM_ROW, ...this.NUMBERS],
                handPosition: 'all',
                exercises: [
                    { id: 'ex-6-1', text: 'I love to play games and learn new things', difficulty: 'EASY', targetWPM: 25 },
                    { id: 'ex-6-2', text: 'My favorite color is blue like the sky', difficulty: 'EASY', targetWPM: 25 },
                    { id: 'ex-6-3', text: 'The sun is shining bright today', difficulty: 'EASY', targetWPM: 30 },
                    { id: 'ex-6-4', text: 'I can count to 100 and type all the numbers', difficulty: 'MEDIUM', targetWPM: 30 },
                    { id: 'ex-6-5', text: 'Reading books helps me learn new words every day', difficulty: 'MEDIUM', targetWPM: 35 },
                    { id: 'ex-6-6', text: 'Practice makes perfect when learning to type', difficulty: 'MEDIUM', targetWPM: 35 },
                    { id: 'ex-6-7', text: 'The rainbow has 7 beautiful colors in the sky', difficulty: 'HARD', targetWPM: 40 },
                    { id: 'ex-6-8', text: 'I am becoming a typing expert with every lesson', difficulty: 'HARD', targetWPM: 40 },
                ]
            }
        ]
    }

    static getHandPlacementGuide() {
        return {
            leftHand: {
                pinky: ['q', 'a', 'z', '1'],
                ring: ['w', 's', 'x', '2'],
                middle: ['e', 'd', 'c', '3'],
                index: ['r', 'f', 'v', 't', 'g', 'b', '4', '5'],
                thumb: ['space']
            },
            rightHand: {
                thumb: ['space'],
                index: ['y', 'h', 'n', 'u', 'j', 'm', '6', '7'],
                middle: ['i', 'k', ',', '8'],
                ring: ['o', 'l', '.', '9'],
                pinky: ['p', ';', '/', '0', '[', ']', "'"]
            },
            homeRow: {
                left: ['a', 's', 'd', 'f'],
                right: ['j', 'k', 'l', ';']
            }
        }
    }

    static getKeyboardLayout() {
        return {
            row1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            row2: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            row3: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
            row4: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
        }
    }

    static generateContentPool(): ContentPool {
        const lessons = this.getLessons()
        const allExercises = lessons.flatMap(lesson =>
            lesson.exercises.map(ex => ({
                id: ex.id,
                type: 'typing-tutor',
                difficulty: ex.difficulty,
                content: {
                    text: ex.text,
                    targetWPM: ex.targetWPM,
                    lesson: lesson.title,
                    level: lesson.level,
                    focusKeys: ex.focusKeys || []
                },
                correctAnswer: 0,
                timeLimit: 120,
                points: 10
            }))
        )

        const easy = allExercises.filter(ex => ex.difficulty === 'EASY')
        const medium = allExercises.filter(ex => ex.difficulty === 'MEDIUM')
        const hard = allExercises.filter(ex => ex.difficulty === 'HARD')

        return { easy, medium, hard, challenge: hard }
    }
}
