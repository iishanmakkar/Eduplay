/**
 * Logic Puzzle Content Pool
 * Deduction and reasoning challenges
 */

import { Question, ContentPool } from '../content-generator'

export interface LogicPuzzleQuestion extends Question {
    content: {
        scenario: string
        clues: string[]
        question: string
        puzzleType: 'deduction' | 'sequence' | 'grid' | 'riddle'
    }
    options: string[]
    correctAnswer: number
}

export class LogicPuzzleContent {
    static generateContentPool(): ContentPool {
        return {
            easy: this.getEasyPuzzles(),
            medium: this.getMediumPuzzles(),
            hard: this.getHardPuzzles(),
            challenge: this.getChallengePuzzles()
        }
    }

    private static getEasyPuzzles(): LogicPuzzleQuestion[] {
        return [
            {
                id: 'logic-easy-1',
                type: 'logic-puzzle',
                difficulty: 'EASY',
                content: {
                    scenario: 'Three friends have different pets.',
                    clues: [
                        'Sarah has a dog',
                        'Mike does not have a cat',
                        'Lisa has either a cat or a bird'
                    ],
                    question: 'What pet does Mike have?',
                    puzzleType: 'deduction'
                },
                options: ['Dog', 'Cat', 'Bird', 'Fish'],
                correctAnswer: 2,
                timeLimit: 30,
                points: 10
            },
            {
                id: 'logic-easy-2',
                type: 'logic-puzzle',
                difficulty: 'EASY',
                content: {
                    scenario: 'Four students finished a race.',
                    clues: [
                        'Tom finished before Jerry',
                        'Jerry finished before Mike',
                        'Sarah finished last'
                    ],
                    question: 'Who finished first?',
                    puzzleType: 'sequence'
                },
                options: ['Tom', 'Jerry', 'Mike', 'Sarah'],
                correctAnswer: 0,
                timeLimit: 30,
                points: 10
            },
            {
                id: 'logic-easy-3',
                type: 'logic-puzzle',
                difficulty: 'EASY',
                content: {
                    scenario: 'A farmer has chickens and cows.',
                    clues: [
                        'There are 10 animals total',
                        'There are 28 legs total',
                        'Chickens have 2 legs, cows have 4 legs'
                    ],
                    question: 'How many cows are there?',
                    puzzleType: 'deduction'
                },
                options: ['3', '4', '5', '6'],
                correctAnswer: 1,
                timeLimit: 45,
                points: 10
            },
            {
                id: 'logic-easy-4',
                type: 'logic-puzzle',
                difficulty: 'EASY',
                content: {
                    scenario: 'Three boxes contain different fruits.',
                    clues: [
                        'Box A is not apples',
                        'Box B contains oranges',
                        'Box C is not oranges'
                    ],
                    question: 'What does Box A contain?',
                    puzzleType: 'deduction'
                },
                options: ['Apples', 'Oranges', 'Bananas', 'Cannot determine'],
                correctAnswer: 2,
                timeLimit: 30,
                points: 10
            },
            {
                id: 'logic-easy-5',
                type: 'logic-puzzle',
                difficulty: 'EASY',
                content: {
                    scenario: 'What comes next in the sequence?',
                    clues: [
                        '2, 4, 6, 8, ...'
                    ],
                    question: 'What number comes next?',
                    puzzleType: 'sequence'
                },
                options: ['9', '10', '11', '12'],
                correctAnswer: 1,
                timeLimit: 20,
                points: 10
            }
        ]
    }

    private static getMediumPuzzles(): LogicPuzzleQuestion[] {
        return [
            {
                id: 'logic-medium-1',
                type: 'logic-puzzle',
                difficulty: 'MEDIUM',
                content: {
                    scenario: 'Five people are sitting in a row.',
                    clues: [
                        'Alice is not at either end',
                        'Bob is next to Charlie',
                        'Diana is at one end',
                        'Eve is between Alice and Bob'
                    ],
                    question: 'Who is at the other end?',
                    puzzleType: 'grid'
                },
                options: ['Alice', 'Bob', 'Charlie', 'Eve'],
                correctAnswer: 2,
                timeLimit: 60,
                points: 20
            },
            {
                id: 'logic-medium-2',
                type: 'logic-puzzle',
                difficulty: 'MEDIUM',
                content: {
                    scenario: 'A clock shows 3:15.',
                    clues: [
                        'What is the angle between hour and minute hands?'
                    ],
                    question: 'Select the correct angle:',
                    puzzleType: 'deduction'
                },
                options: ['0°', '7.5°', '15°', '22.5°'],
                correctAnswer: 1,
                timeLimit: 45,
                points: 20
            },
            {
                id: 'logic-medium-3',
                type: 'logic-puzzle',
                difficulty: 'MEDIUM',
                content: {
                    scenario: 'Three switches control three light bulbs in another room.',
                    clues: [
                        'You can flip switches, then check bulbs once',
                        'How do you determine which switch controls which bulb?'
                    ],
                    question: 'What is the strategy?',
                    puzzleType: 'riddle'
                },
                options: [
                    'Flip all switches',
                    'Flip one, wait, flip another, then check',
                    'Flip each one at a time',
                    'Cannot determine'
                ],
                correctAnswer: 1,
                timeLimit: 60,
                points: 20
            },
            {
                id: 'logic-medium-4',
                type: 'logic-puzzle',
                difficulty: 'MEDIUM',
                content: {
                    scenario: 'What comes next?',
                    clues: [
                        '1, 1, 2, 3, 5, 8, ...'
                    ],
                    question: 'What number comes next?',
                    puzzleType: 'sequence'
                },
                options: ['11', '12', '13', '14'],
                correctAnswer: 2,
                timeLimit: 30,
                points: 20
            },
            {
                id: 'logic-medium-5',
                type: 'logic-puzzle',
                difficulty: 'MEDIUM',
                content: {
                    scenario: 'Four friends have different jobs.',
                    clues: [
                        'The doctor is older than the teacher',
                        'The engineer is younger than the lawyer',
                        'The teacher is younger than the engineer',
                        'Alex is the oldest'
                    ],
                    question: 'What is Alex\'s job?',
                    puzzleType: 'deduction'
                },
                options: ['Doctor', 'Teacher', 'Engineer', 'Lawyer'],
                correctAnswer: 0,
                timeLimit: 60,
                points: 20
            }
        ]
    }

    private static getHardPuzzles(): LogicPuzzleQuestion[] {
        return [
            {
                id: 'logic-hard-1',
                type: 'logic-puzzle',
                difficulty: 'HARD',
                content: {
                    scenario: 'You have 12 balls, one is heavier or lighter.',
                    clues: [
                        'You have a balance scale',
                        'You can use it 3 times',
                        'Find the odd ball and determine if heavier or lighter'
                    ],
                    question: 'Minimum weighings needed?',
                    puzzleType: 'deduction'
                },
                options: ['2', '3', '4', '5'],
                correctAnswer: 1,
                timeLimit: 90,
                points: 30
            },
            {
                id: 'logic-hard-2',
                type: 'logic-puzzle',
                difficulty: 'HARD',
                content: {
                    scenario: 'A snail climbs a 10-meter wall.',
                    clues: [
                        'Climbs 3 meters during day',
                        'Slides down 2 meters at night',
                        'How many days to reach the top?'
                    ],
                    question: 'Number of days:',
                    puzzleType: 'deduction'
                },
                options: ['8', '9', '10', '11'],
                correctAnswer: 0,
                timeLimit: 60,
                points: 30
            },
            {
                id: 'logic-hard-3',
                type: 'logic-puzzle',
                difficulty: 'HARD',
                content: {
                    scenario: 'Three people wearing hats.',
                    clues: [
                        'Each hat is red or blue',
                        'Each person can see others\' hats but not their own',
                        'At least one hat is red',
                        'First two say "I don\'t know my color"',
                        'Third person knows their color'
                    ],
                    question: 'What color is the third person\'s hat?',
                    puzzleType: 'riddle'
                },
                options: ['Red', 'Blue', 'Cannot determine', 'Either color'],
                correctAnswer: 0,
                timeLimit: 90,
                points: 30
            }
        ]
    }

    private static getChallengePuzzles(): LogicPuzzleQuestion[] {
        return [
            {
                id: 'logic-challenge-1',
                type: 'logic-puzzle',
                difficulty: 'CHALLENGE',
                content: {
                    scenario: 'The Monty Hall Problem',
                    clues: [
                        'Three doors: one has a car, two have goats',
                        'You pick door 1',
                        'Host opens door 3, showing a goat',
                        'Host offers to let you switch to door 2'
                    ],
                    question: 'Should you switch?',
                    puzzleType: 'riddle'
                },
                options: [
                    'Yes, switching doubles your chances',
                    'No, odds are the same',
                    'Doesn\'t matter',
                    'Switch only if you like goats'
                ],
                correctAnswer: 0,
                timeLimit: 120,
                points: 50
            },
            {
                id: 'logic-challenge-2',
                type: 'logic-puzzle',
                difficulty: 'CHALLENGE',
                content: {
                    scenario: 'Bridge and Torch Problem',
                    clues: [
                        'Four people need to cross a bridge at night',
                        'Bridge holds max 2 people',
                        'They have one torch, must be carried',
                        'Times: A=1min, B=2min, C=5min, D=10min',
                        'Two people cross at slower person\'s speed'
                    ],
                    question: 'Minimum time for all to cross?',
                    puzzleType: 'deduction'
                },
                options: ['15 minutes', '17 minutes', '19 minutes', '21 minutes'],
                correctAnswer: 1,
                timeLimit: 120,
                points: 50
            },
            {
                id: 'logic-challenge-3',
                type: 'logic-puzzle',
                difficulty: 'CHALLENGE',
                content: {
                    scenario: 'Green-Eyed Dragons',
                    clues: [
                        'Island of 100 perfectly logical dragons',
                        'All have green eyes, but cannot see their own',
                        'They can see others\' eyes',
                        'Rule: If a dragon knows it has green eyes, it flies away at midnight',
                        'No communication allowed',
                        'A visitor says "At least one of you has green eyes"'
                    ],
                    question: 'What happens?',
                    puzzleType: 'deduction'
                },
                options: [
                    'Nothing happens',
                    'All 100 dragons fly away on the 100th night',
                    'One dragon flies away immediately',
                    'They all fight'
                ],
                correctAnswer: 1,
                timeLimit: 180,
                points: 100
            },
            {
                id: 'logic-challenge-4',
                type: 'logic-puzzle',
                difficulty: 'CHALLENGE',
                content: {
                    scenario: '100 Light Bulbs',
                    clues: [
                        '100 bulbs off',
                        '100 people pass by',
                        'Person 1 flips every switch',
                        'Person 2 flips every 2nd switch',
                        'Person n flips every nth switch'
                    ],
                    question: 'How many bulbs are on after 100 people?',
                    puzzleType: 'deduction'
                },
                options: ['10', '50', '90', '100'],
                correctAnswer: 0,
                timeLimit: 150,
                points: 75
            }
        ]
    }
}
