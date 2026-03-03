/**
 * Knowledge Question Generator — Part 2
 * CS, GK, Hindi, more Science and Social Studies games
 */

import { GenQuestion } from './math-generator'

function r(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = r(0, i);[a[i], a[j]] = [a[j], a[i]] }; return a
}
type Fact = { q: string; a: string; v?: string }
function genFromPool(facts: Fact[], visual?: string): GenQuestion {
    const item = facts[r(0, facts.length - 1)]
    // Deduplicate wrong answers by answer string to prevent DUPLICATE_OPTIONS
    const seenAnswers = new Set<string>([item.a.toLowerCase().trim()])
    const wrongPool: string[] = []
    for (const f of shuffle(facts.filter(f => f.a.toLowerCase().trim() !== item.a.toLowerCase().trim()))) {
        const key = f.a.toLowerCase().trim()
        if (!seenAnswers.has(key)) {
            seenAnswers.add(key)
            wrongPool.push(f.a)
            if (wrongPool.length === 3) break
        }
    }
    // Pad with generic distractors if pool too small (safety net)
    while (wrongPool.length < 3) wrongPool.push(`Option ${wrongPool.length + 2}`)
    return { prompt: item.q, options: shuffle([item.a, ...wrongPool]), answer: item.a, visual: item.v ?? visual }
}

// ── CS GAMES ──────────────────────────────────────────────────────────────────

const BINARY_FACTS: Fact[] = [
    { q: 'Binary for 1?', a: '1' }, { q: 'Binary for 2?', a: '10' }, { q: 'Binary for 3?', a: '11' }, { q: 'Binary for 4?', a: '100' },
    { q: 'Binary for 5?', a: '101' }, { q: 'Binary for 6?', a: '110' }, { q: 'Binary for 7?', a: '111' }, { q: 'Binary for 8?', a: '1000' },
    { q: 'Binary for 10?', a: '1010' }, { q: 'Binary for 15?', a: '1111' }, { q: 'Binary for 16?', a: '10000' },
    { q: 'Binary for 0?', a: '0' }, { q: 'Decimal value of binary 1010?', a: '10' }, { q: 'Decimal value of binary 1111?', a: '15' },
    { q: 'Decimal value of binary 10000?', a: '16' }, { q: 'Decimal value of binary 1001?', a: '9' },
    { q: 'Decimal value of binary 1100?', a: '12' }, { q: 'Decimal value of binary 101?', a: '5' },
    { q: 'Base of binary number system?', a: '2' }, { q: 'Base of decimal system?', a: '10' },
    { q: 'Base of hexadecimal system?', a: '16' }, { q: 'Base of octal system?', a: '8' },
    { q: 'Hexadecimal A = decimal?', a: '10' }, { q: 'Hexadecimal F = decimal?', a: '15' },
    { q: 'Hexadecimal 10 = decimal?', a: '16' }, { q: '1 byte = how many bits?', a: '8' },
    { q: '1 kilobyte = how many bytes?', a: '1024' }, { q: '1 megabyte = how many kilobytes?', a: '1024' },
    { q: '1 nibble = how many bits?', a: '4' }, { q: 'ASCII code of "A"?', a: '65' },
    { q: 'ASCII code of "a"?', a: '97' }, { q: 'ASCII code of "0"?', a: '48' },
    { q: 'Binary 1 + 1 = ?', a: '10 (binary)' }, { q: 'Binary 1 + 0 = ?', a: '1' },
    { q: 'Two\'s complement is used to represent?', a: 'Negative numbers in binary' },
    { q: 'AND of 1010 and 1100?', a: '1000' }, { q: 'OR of 1010 and 1100?', a: '1110' },
    { q: 'XOR of 1010 and 1010?', a: '0000' }, { q: 'NOT of 1010 (4-bit)?', a: '0101' },
    { q: 'Octal 7 = decimal?', a: '7' }, { q: 'Octal 10 = decimal?', a: '8' },
    { q: 'Hex FF = decimal?', a: '255' }, { q: '1 gigabyte = how many megabytes?', a: '1024' },
    { q: 'Binary for 255?', a: '11111111' }, { q: 'Left shift by 1 in binary multiplies by?', a: '2' },
    { q: 'Right shift by 1 in binary divides by?', a: '2' },
]
export function genBinaryBlaster(): GenQuestion { return genFromPool(BINARY_FACTS, '💻') }

const CYBER_FACTS: Fact[] = [
    { q: 'Phishing is?', a: 'Fraudulent emails/sites stealing credentials' }, { q: 'Malware means?', a: 'Malicious software designed to harm systems' },
    { q: 'Ransomware does?', a: 'Encrypts your files and demands payment' }, { q: 'Firewall does?', a: 'Monitors and controls network traffic' },
    { q: 'VPN stands for?', a: 'Virtual Private Network' }, { q: 'HTTPS means?', a: 'Encrypted HTTP connection' },
    { q: '2FA stands for?', a: 'Two-Factor Authentication' }, { q: 'DDoS stands for?', a: 'Distributed Denial of Service' },
    { q: 'SQL Injection targets?', a: 'Database via malicious SQL in input fields' }, { q: 'Brute force attack?', a: 'Tries all possible passwords/keys' },
    { q: 'Social engineering targets?', a: 'Human psychology to manipulate' }, { q: 'Zero-day vulnerability?', a: 'Unknown flaw not yet patched by developer' },
    { q: 'Encryption purpose?', a: 'Make data unreadable without a key' }, { q: 'Public key in asymmetric encryption?', a: 'Shared freely with anyone' },
    { q: 'Private key must be?', a: 'Kept secret by the owner' }, { q: 'RSA is?', a: 'Asymmetric (public-key) encryption algorithm' },
    { q: 'AES is?', a: 'Symmetric encryption standard (Advanced Encryption Standard)' }, { q: 'Hash function is?', a: 'One-way function producing fixed-size output' },
    { q: 'MD5 is used for?', a: 'Hashing (not secure for passwords now)' }, { q: 'SHA-256 produces a hash of?', a: '256 bits' },
    { q: 'WPA2 is a standard for?', a: 'Wi-Fi security' }, { q: 'SSL/TLS protects?', a: 'Data in transit between browser and server' },
    { q: 'Port 443 is used for?', a: 'HTTPS' }, { q: 'Port 80 is used for?', a: 'HTTP' },
    { q: 'Port 22 is used for?', a: 'SSH (Secure Shell)' }, { q: 'Principle of least privilege means?', a: 'Users get only minimum access needed' },
    { q: 'A honeypot in cybersecurity is?', a: 'A decoy system to attract attackers' }, { q: 'Penetration testing is?', a: 'Authorised simulated attack to find vulnerabilities' },
    { q: 'Keylogger records?', a: 'Keystrokes to steal passwords and data' }, { q: 'Trojan horse is malware that?', a: 'Disguises itself as legitimate software' },
    { q: 'Worm differs from virus because it?', a: 'Self-replicates without needing a host file' }, { q: 'Virus needs a?', a: 'Host file to attach to and spread' },
    { q: 'Spyware does?', a: 'Secretly monitors and collects user data' }, { q: 'Adware does?', a: 'Displays unwanted advertisements' },
    { q: 'Digital certificate is issued by?', a: 'Certificate Authority (CA)' }, { q: 'Biometric authentication uses?', a: 'Physical characteristics (fingerprint, face, iris)' },
    { q: 'Steganography means?', a: 'Hiding data within another file (e.g., image)' }, { q: 'End-to-end encryption means?', a: 'Only sender and receiver can read messages' },
    { q: 'GDPR stands for?', a: 'General Data Protection Regulation' }, { q: 'Data breach means?', a: 'Unauthorised access to sensitive data' },
]
export function genCyberShield(): GenQuestion { return genFromPool(CYBER_FACTS, '🔐') }

const DEBUG_FACTS: Fact[] = [
    { q: 'SyntaxError means?', a: 'Code grammar is wrong (e.g., missing bracket)' }, { q: 'TypeError means?', a: 'Wrong data type in operation' },
    { q: 'NameError means?', a: 'Variable or function not defined' }, { q: 'IndexError means?', a: 'List index out of range' },
    { q: 'KeyError means?', a: 'Dictionary key not found' }, { q: 'AttributeError means?', a: 'Object has no such attribute/method' },
    { q: 'ValueError means?', a: 'Correct type but invalid value' }, { q: 'ZeroDivisionError means?', a: 'Division or modulo by zero' },
    { q: 'Logic error means?', a: 'Code runs but gives wrong output' }, { q: 'Runtime error means?', a: 'Error occurring during program execution' },
    { q: 'Compile error occurs?', a: 'Before the program runs' }, { q: 'A debugger helps?', a: 'Step through code to find bugs' },
    { q: 'Off-by-one error often affects?', a: 'Loop ranges and array indexing' }, { q: 'Infinite loop occurs when?', a: 'Loop condition never becomes false' },
    { q: 'Which operator checks equality in Python?', a: '==' }, { q: 'Assignment operator vs equality?', a: '= assigns, == compares' },
    { q: 'Python comment character?', a: '#' }, { q: 'Python list index starts at?', a: '0' },
    { q: 'Indentation in Python is?', a: 'Required for code blocks (not optional)' }, { q: 'print("Hello World") — output?', a: 'Hello World' },
    { q: 'len([1,2,3]) returns?', a: '3' }, { q: 'range(5) generates?', a: '0, 1, 2, 3, 4' },
    { q: 'True and False are?', a: 'Boolean values' }, { q: 'None in Python means?', a: 'Absence of a value (null equivalent)' },
    { q: 'What does a function return without a return statement?', a: 'None' }, { q: 'Recursion is when a function?', a: 'Calls itself' },
    { q: 'Stack overflow in recursion occurs when?', a: 'Base case is missing or never reached' }, { q: 'try-except is used for?', a: 'Handling exceptions (errors) gracefully' },
    { q: 'What is a linter?', a: 'Tool that checks code for style and potential errors' }, { q: 'Unit testing tests?', a: 'Individual functions or components in isolation' },
    { q: 'Version control (git) tracks?', a: 'Changes to code over time' }, { q: '"print(list[3])" when list has 3 elements causes?', a: 'IndexError' },
    { q: 'String concatenation in Python uses?', a: '+ operator or f-strings' }, { q: 'f-string syntax?', a: 'f"text {variable} text"' },
    { q: 'Mutable means?', a: 'Can be changed after creation (e.g., list)' }, { q: 'Immutable means?', a: 'Cannot be changed after creation (e.g., tuple, string)' },
]
export function genDebugDuel(): GenQuestion { return genFromPool(DEBUG_FACTS, '🐛') }

const LOGIC_GATE_FACTS: Fact[] = [
    { q: 'AND gate: 1 AND 1?', a: '1' }, { q: 'AND gate: 1 AND 0?', a: '0' }, { q: 'AND gate: 0 AND 0?', a: '0' },
    { q: 'OR gate: 0 OR 0?', a: '0' }, { q: 'OR gate: 1 OR 0?', a: '1' }, { q: 'OR gate: 1 OR 1?', a: '1' },
    { q: 'NOT gate: NOT 1?', a: '0' }, { q: 'NOT gate: NOT 0?', a: '1' },
    { q: 'NAND gate: 1 NAND 1?', a: '0' }, { q: 'NAND gate: 1 NAND 0?', a: '1' }, { q: 'NAND gate: 0 NAND 0?', a: '1' },
    { q: 'NOR gate: 0 NOR 0?', a: '1' }, { q: 'NOR gate: 1 NOR 0?', a: '0' }, { q: 'NOR gate: 1 NOR 1?', a: '0' },
    { q: 'XOR gate: 1 XOR 1?', a: '0' }, { q: 'XOR gate: 1 XOR 0?', a: '1' }, { q: 'XOR gate: 0 XOR 0?', a: '0' },
    { q: 'XNOR gate: 1 XNOR 1?', a: '1' }, { q: 'XNOR gate: 1 XNOR 0?', a: '0' }, { q: 'XNOR gate: 0 XNOR 0?', a: '1' },
    { q: 'Universal gate (can make all others)?', a: 'NAND (or NOR)' }, { q: 'De Morgan: NOT(A AND B) = ?', a: 'NOT A OR NOT B' },
    { q: 'De Morgan: NOT(A OR B) = ?', a: 'NOT A AND NOT B' }, { q: 'Boolean: A + A = ?', a: 'A' },
    { q: 'Boolean: A · A = ?', a: 'A' }, { q: 'Boolean: A + 1 = ?', a: '1' }, { q: 'Boolean: A · 0 = ?', a: '0' },
    { q: 'Boolean: A + 0 = ?', a: 'A' }, { q: 'Boolean: A · 1 = ?', a: 'A' }, { q: 'Boolean: A · NOT A = ?', a: '0' },
    { q: 'Boolean: A + NOT A = ?', a: '1' }, { q: 'A half adder adds?', a: 'Two 1-bit numbers' },
    { q: 'Full adder adds?', a: 'Two bits plus carry-in' }, { q: 'Multiplexer selects?', a: 'One of many inputs based on select lines' },
    { q: 'Demultiplexer distributes?', a: 'One input to one of many outputs' },
    { q: 'Flip-flop stores?', a: '1 bit of data (memory element)' }, { q: 'SR latch has inputs?', a: 'Set and Reset' },
    { q: 'Clock signal in digital circuits controls?', a: 'Timing of state changes' }, { q: 'Combinational circuit output depends on?', a: 'Current inputs only' },
    { q: 'Sequential circuit output depends on?', a: 'Current inputs and past state (memory)' },
]
export function genLogicGateGarden(): GenQuestion { return genFromPool(LOGIC_GATE_FACTS, '🧮') }

// ── GK GAMES ──────────────────────────────────────────────────────────────────

const INVENTOR_FACTS: Fact[] = [
    { q: 'Telephone invented by?', a: 'Alexander Graham Bell' }, { q: 'Light bulb (practical) invented by?', a: 'Thomas Edison' },
    { q: 'Printing press invented by?', a: 'Johannes Gutenberg' }, { q: 'Aeroplane invented by?', a: 'Wright Brothers (Orville & Wilbur)' },
    { q: 'Radio invented by?', a: 'Guglielmo Marconi' }, { q: 'Television invented by?', a: 'John Logie Baird' },
    { q: 'World Wide Web invented by?', a: 'Tim Berners-Lee' }, { q: 'Steam engine improved by?', a: 'James Watt' },
    { q: 'Penicillin discovered by?', a: 'Alexander Fleming' }, { q: 'Vaccination pioneered by?', a: 'Edward Jenner' },
    { q: 'Theory of relativity proposed by?', a: 'Albert Einstein' }, { q: 'Laws of motion and gravity by?', a: 'Isaac Newton' },
    { q: 'DNA double helix discovered by?', a: 'Watson, Crick & Franklin' }, { q: 'Radioactivity discovered by?', a: 'Marie Curie' },
    { q: 'Telescope invented by?', a: 'Hans Lippershey' }, { q: 'C programming language created by?', a: 'Dennis Ritchie' },
    { q: 'Linux created by?', a: 'Linus Torvalds' }, { q: 'Python created by?', a: 'Guido van Rossum' },
    { q: 'Java created by?', a: 'James Gosling' }, { q: 'Electric battery invented by?', a: 'Alessandro Volta' },
    { q: 'Dynamite invented by?', a: 'Alfred Nobel' }, { q: 'Calculus independently developed by?', a: 'Newton and Leibniz' },
    { q: 'Heliocentric model proposed by?', a: 'Copernicus' }, { q: 'Computer (mechanical) invented by?', a: 'Charles Babbage' },
    { q: 'ENIAC (first electronic computer) created at?', a: 'University of Pennsylvania (1945)' }, { q: 'Internet (ARPANET) created by?', a: 'DARPA (US Department of Defense)' },
    { q: 'Microscope invented by?', a: 'Antonie van Leeuwenhoek (or Janssen)' }, { q: 'X-rays discovered by?', a: 'Wilhelm Röntgen' },
    { q: 'Relativity equation E=mc² by?', a: 'Albert Einstein' }, { q: 'Insulin discovered by?', a: 'Frederick Banting and Charles Best' },
    { q: 'Aspirin developed by?', a: 'Felix Hoffmann (Bayer)' }, { q: 'First antibiotic was?', a: 'Penicillin' },
    { q: 'First vaccine was for?', a: 'Smallpox' }, { q: 'Safety pin invented by?', a: 'Walter Hunt' },
    { q: 'Zip fastener invented by?', a: 'Whitcomb Judson' }, { q: 'Ballpoint pen invented by?', a: 'László Bíró' },
    { q: 'Barcode invented by?', a: 'Norman Woodland and Bernard Silver' }, { q: 'GPS invented by?', a: 'US Department of Defense' },
    { q: 'iPhone launched by?', a: 'Steve Jobs / Apple (2007)' }, { q: 'Facebook founded by?', a: 'Mark Zuckerberg (2004)' },
]
export function genInventorsWorkshop(): GenQuestion { return genFromPool(INVENTOR_FACTS, '🌟') }

const GENERAL_KNOWLEDGE_FACTS: Fact[] = [
    { q: 'Largest continent?', a: 'Asia' }, { q: 'Smallest continent?', a: 'Australia (or Antarctica)' },
    { q: 'Deepest ocean trench?', a: 'Mariana Trench (Pacific)' }, { q: 'Longest river?', a: 'Nile (or Amazon by volume)' },
    { q: 'Highest mountain?', a: 'Mount Everest' }, { q: 'Largest ocean?', a: 'Pacific Ocean' },
    { q: 'Smallest country?', a: 'Vatican City' }, { q: 'Largest country?', a: 'Russia' },
    { q: 'Most spoken language?', a: 'Mandarin Chinese (or English by total speakers)' }, { q: 'Most spoken language (official)?', a: 'English' },
    { q: 'Human body has how many bones?', a: '206' }, { q: 'Heart has how many chambers?', a: '4' },
    { q: 'Blood type called universal donor?', a: 'O negative' }, { q: 'Blood type called universal recipient?', a: 'AB positive' },
    { q: 'Largest organ of human body?', a: 'Skin' }, { q: 'Fastest nerve impulse speed?', a: '~120 m/s' },
    { q: 'Normal human body temperature?', a: '37°C (98.6°F)' }, { q: 'Human chromosomes?', a: '23 pairs (46 total)' },
    { q: 'Speed of light?', a: '~3 × 10⁸ m/s' }, { q: 'Speed of sound in air?', a: '~343 m/s' },
    { q: 'Boiling point of water at sea level?', a: '100°C' }, { q: 'Freezing point of water?', a: '0°C' },
    { q: 'Force of gravity on Earth?', a: '9.8 m/s²' }, { q: 'One millennium = how many years?', a: '1000' },
    { q: 'One decade = how many years?', a: '10' }, { q: 'One century = how many years?', a: '100' },
    { q: '2024 Olympics held in?', a: 'Paris' }, { q: 'FIFA World Cup 2022 winner?', a: 'Argentina' },
    { q: 'Bharat Ratna is India\'s?', a: 'Highest civilian honour' }, { q: 'Nobel Prize categories?', a: 'Peace, Physics, Chemistry, Medicine, Literature, Economics' },
    { q: 'Who wrote "Harry Potter"?', a: 'J.K. Rowling' }, { q: 'Who wrote "Romeo and Juliet"?', a: 'William Shakespeare' },
    { q: 'United Nations has how many member states?', a: '193' }, { q: 'WHO stands for?', a: 'World Health Organisation' },
    { q: 'UNESCO stands for?', a: 'UN Educational, Scientific and Cultural Organisation' }, { q: 'UNICEF stands for?', a: 'UN International Children\'s Emergency Fund' },
    { q: 'G7 countries?', a: 'USA, UK, Canada, France, Germany, Italy, Japan' }, { q: 'Permanent UN Security Council members?', a: 'USA, UK, France, Russia, China' },
]
export function genOlympiadQualifier(): GenQuestion { return genFromPool(GENERAL_KNOWLEDGE_FACTS, '🏆') }

export function genCriticalThinkersCourt(): GenQuestion {
    const LOGIC_FACTS: Fact[] = [
        { q: '"All X are Y, all Y are Z, so all X are Z" — this is?', a: 'Hypothetical syllogism (valid)' }, { q: 'Straw man fallacy?', a: 'Misrepresenting opponent\'s argument to attack it' },
        { q: '"Everyone is doing it" is?', a: 'Bandwagon fallacy' }, { q: 'Ad hominem means?', a: 'Attacking the person instead of the argument' },
        { q: 'False dichotomy presents?', a: 'Only two options when more exist' }, { q: 'Red herring is?', a: 'A distraction from the main issue' },
        { q: 'Slippery slope assumes?', a: 'One event will inevitably lead to extreme consequences' }, { q: 'Hasty generalisation?', a: 'Broad conclusion from insufficient evidence' },
        { q: 'Post hoc fallacy?', a: 'Assuming causation because B followed A' }, { q: 'Circular reasoning (begging the question)?', a: 'Using the conclusion as its own premise' },
        { q: 'Correlation means?', a: 'Two variables tend to change together' }, { q: 'Correlation does NOT imply?', a: 'Causation' },
        { q: 'Deductive reasoning: general → ?', a: 'Specific conclusion' }, { q: 'Inductive reasoning: specific → ?', a: 'General conclusion' },
        { q: 'A valid argument with true premises is called?', a: 'Sound argument' }, { q: 'Occam\'s Razor says?', a: 'The simplest explanation is usually best' },
        { q: 'Confirmation bias means?', a: 'Seeking info that confirms existing beliefs' }, { q: 'Best evidence for scientific claim?', a: 'Peer-reviewed, replicated experimental research' },
        { q: 'Anecdotal evidence is?', a: 'Personal story — weak; doesn\'t prove general claim' }, { q: 'Authority appeal is strongest when?', a: 'Authority is relevant, qualified, and claims are verifiable' },
        { q: 'Falsifiability means a claim can be?', a: 'Proven wrong by evidence (a requirement for science)' }, { q: 'A hypothesis differs from a theory because?', a: 'A theory is well-tested and widely supported; hypothesis is initial' },
        { q: '"If A then B; not B; therefore not A" is?', a: 'Modus tollens (valid)' }, { q: '"If A then B; A; therefore B" is?', a: 'Modus ponens (valid)' },
    ]
    return genFromPool(LOGIC_FACTS, '📊')
}

// ── HINDI GAMES ───────────────────────────────────────────────────────────────

const HINDI_VOCAB_FACTS: Fact[] = [
    { q: '"पानी" का English?', a: 'Water' }, { q: '"आग" का English?', a: 'Fire' }, { q: '"हवा" का English?', a: 'Air' },
    { q: '"मिट्टी" का English?', a: 'Soil/Earth' }, { q: '"सूरज" का English?', a: 'Sun' }, { q: '"चाँद" का English?', a: 'Moon' },
    { q: '"तारा" का English?', a: 'Star' }, { q: '"पेड़" का English?', a: 'Tree' }, { q: '"फूल" का English?', a: 'Flower' },
    { q: '"नदी" का English?', a: 'River' }, { q: '"पहाड़" का English?', a: 'Mountain' }, { q: '"समुद्र" का English?', a: 'Sea/Ocean' },
    { q: '"बाज़ार" का English?', a: 'Market' }, { q: '"घर" का English?', a: 'Home/House' }, { q: '"स्कूल" का English?', a: 'School' },
    { q: '"किताब" का English?', a: 'Book' }, { q: '"कलम" का English?', a: 'Pen' }, { q: '"दोस्त" का English?', a: 'Friend' },
    { q: '"माँ" का English?', a: 'Mother' }, { q: '"पिता" का English?', a: 'Father' }, { q: '"भाई" का English?', a: 'Brother' },
    { q: '"बहन" का English?', a: 'Sister' }, { q: '"बच्चा" का English?', a: 'Child' }, { q: '"शेर" का English?', a: 'Lion' },
    { q: '"हाथी" का English?', a: 'Elephant' }, { q: '"घोड़ा" का English?', a: 'Horse' }, { q: '"गाय" का English?', a: 'Cow' },
    { q: '"मछली" का English?', a: 'Fish' }, { q: '"पक्षी" का English?', a: 'Bird' }, { q: '"साँप" का English?', a: 'Snake' },
    { q: '"खाना" का English?', a: 'Food' }, { q: '"पानी पीना" मतलब?', a: 'Drinking water' }, { q: '"खुश" का अर्थ English में?', a: 'Happy' },
    { q: '"दुखी" का अर्थ?', a: 'Sad' }, { q: '"गुस्सा" का अर्थ?', a: 'Angry' }, { q: '"डर" का अर्थ?', a: 'Fear' },
    { q: '"प्यार" का अर्थ?', a: 'Love' }, { q: '"ज़िंदगी" का अर्थ?', a: 'Life' }, { q: '"सपना" का अर्थ?', a: 'Dream' },
    { q: '"सच" का अर्थ?', a: 'Truth' }, { q: '"झूठ" का अर्थ?', a: 'Lie/False' }, { q: '"आज़ादी" का अर्थ?', a: 'Freedom' },
    { q: '"ताकत" का अर्थ?', a: 'Strength' }, { q: '"बुद्धि" का अर्थ?', a: 'Intelligence/Wisdom' },
]
export function genShabdkoshSprint(): GenQuestion { return genFromPool(HINDI_VOCAB_FACTS, '📚') }

const VARNAMALA_FACTS: Fact[] = [
    { q: 'हिंदी वर्णमाला में स्वर कितने हैं?', a: '11 (अ, आ, इ, ई, उ, ऊ, ऋ, ए, ऐ, ओ, औ)' }, { q: 'हिंदी में व्यंजन कितने होते हैं?', a: '33 (मूल व्यंजन)' },
    { q: '"क" वर्ग में कितने व्यंजन हैं?', a: '5 (क, ख, ग, घ, ङ)' }, { q: '"च" वर्ग में कितने व्यंजन हैं?', a: '5 (च, छ, ज, झ, ञ)' },
    { q: '"ट" वर्ग के 5 व्यंजन?', a: 'ट, ठ, ड, ढ, ण' }, { q: '"त" वर्ग के 5 व्यंजन?', a: 'त, थ, द, ध, न' },
    { q: '"प" वर्ग के 5 व्यंजन?', a: 'प, फ, ब, भ, म' }, { q: 'अन्तस्थ व्यंजन?', a: 'य, र, ल, व' },
    { q: 'ऊष्म व्यंजन?', a: 'श, ष, स, ह' }, { q: '"अ" के बाद स्वर?', a: 'आ' },
    { q: '"ई" के बाद स्वर?', a: 'उ' }, { q: '"ओ" के बाद स्वर?', a: 'औ' },
    { q: 'हिंदी लिपि का नाम?', a: 'देवनागरी' }, { q: 'हिंदी की राष्ट्रभाषा का दर्जा कब?', a: '14 सितंबर 1949' },
    { q: '"क" + "अ" = ?', a: 'क' }, { q: 'मात्रा "ा" किस स्वर की?', a: 'आ (aa)' },
    { q: 'मात्रा "ि" किस स्वर की?', a: 'इ (i)' }, { q: 'मात्रा "ी" किस स्वर की?', a: 'ई (ee)' },
    { q: 'मात्रा "ु" किस स्वर की?', a: 'उ (u)' }, { q: 'मात्रा "ू" किस स्वर की?', a: 'ऊ (oo)' },
    { q: 'हलन्त चिह्न दर्शाता है?', a: 'व्यंजन के नीचे — कोई स्वर नहीं' }, { q: 'अनुस्वार क्या है?', a: 'नासिक ध्वनि का चिह्न (ं)' },
    { q: 'विसर्ग (:) क्या है?', a: 'हकार जैसी ध्वनि का चिह्न' }, { q: '"ज्ञ" किन दो वर्णों से बना है?', a: 'ज + ञ' },
    { q: '"क्ष" किन वर्णों से बना है?', a: 'क + ष' }, { q: '"त्र" किन वर्णों से बना है?', a: 'त + र' },
    { q: 'संयुक्त व्यंजन हैं?', a: 'क्ष, त्र, ज्ञ, श्र' }, { q: 'हिंदी में शिरोरेखा क्या है?', a: 'अक्षरों के ऊपर की क्षैतिज रेखा' },
]
export function genVarnamalaVillage(): GenQuestion { return genFromPool(VARNAMALA_FACTS, '🌺') }

const VYAKARAN_FACTS: Fact[] = [
    { q: 'संज्ञा किसे कहते हैं?', a: 'व्यक्ति, वस्तु, स्थान या भाव का नाम' }, { q: 'सर्वनाम किसे कहते हैं?', a: 'संज्ञा के बदले प्रयुक्त शब्द' },
    { q: 'विशेषण किसे कहते हैं?', a: 'संज्ञा की विशेषता बताने वाला शब्द' }, { q: 'क्रिया किसे कहते हैं?', a: 'काम करने या होने को दर्शाने वाला शब्द' },
    { q: 'क्रियाविशेषण किसे कहते हैं?', a: 'क्रिया की विशेषता बताने वाला शब्द' }, { q: 'वचन के प्रकार?', a: 'एकवचन और बहुवचन' },
    { q: '"लड़का" का बहुवचन?', a: 'लड़के' }, { q: '"पुस्तक" का बहुवचन?', a: 'पुस्तकें' },
    { q: '"गाय" स्त्रीलिंग है, "बैल" क्या है?', a: 'पुल्लिंग' }, { q: '"नदी" का लिंग?', a: 'स्त्रीलिंग' },
    { q: '"पर्वत" का लिंग?', a: 'पुल्लिंग' }, { q: 'वर्तमान काल उदाहरण?', a: 'वह खेल रहा है' },
    { q: 'भूतकाल उदाहरण?', a: 'वह खेला' }, { q: 'भविष्यकाल उदाहरण?', a: 'वह खेलेगा' },
    { q: 'कर्ता कारक विभक्ति?', a: 'ने' }, { q: 'कर्म कारक विभक्ति?', a: 'को' },
    { q: 'करण कारक विभक्ति?', a: 'से, द्वारा' }, { q: 'संप्रदान कारक विभक्ति?', a: 'को, के लिए' },
    { q: 'अपादान कारक विभक्ति?', a: 'से (अलगाव)' }, { q: 'संबंध कारक विभक्ति?', a: 'का, के, की' },
    { q: 'अधिकरण कारक विभक्ति?', a: 'में, पर' }, { q: 'समबोधन कारक विभक्ति?', a: 'हे, अरे, ओ' },
    { q: '"सुंदर" किस प्रकार का विशेषण है?', a: 'गुणवाचक विशेषण' }, { q: '"दो" किस प्रकार का विशेषण है?', a: 'संख्यावाचक विशेषण' },
    { q: 'पर्यायवाची शब्द क्या होते हैं?', a: 'समान अर्थ वाले शब्द' }, { q: '"घर" का पर्यायवाची?', a: 'गृह, निवास, आवास' },
    { q: '"आकाश" का पर्यायवाची?', a: 'नभ, गगन, अम्बर' }, { q: 'विलोम शब्द क्या होते हैं?', a: 'विपरीत अर्थ वाले शब्द' },
    { q: '"सुबह" का विलोम?', a: 'शाम' }, { q: '"अंधेरा" का विलोम?', a: 'उजाला' },
]
export function genVyakaranWarrior(): GenQuestion { return genFromPool(VYAKARAN_FACTS, '✍️') }

// ── SCIENCE (remaining) ───────────────────────────────────────────────────────

const FORCE_FACTS: Fact[] = [
    { q: 'Newton\'s 1st Law: object at rest stays at rest unless?', a: 'An unbalanced force acts on it' },
    { q: 'Newton\'s 2nd Law: F = ?', a: 'ma (mass × acceleration)' }, { q: 'Newton\'s 3rd Law?', a: 'Every action has an equal and opposite reaction' },
    { q: 'Unit of Force?', a: 'Newton (N)' }, { q: 'Unit of Energy?', a: 'Joule (J)' },
    { q: 'Unit of Power?', a: 'Watt (W)' }, { q: 'Unit of Pressure?', a: 'Pascal (Pa)' },
    { q: 'Weight = ?', a: 'mass × g (gravitational acceleration)' }, { q: 'On Moon weight is 1/6 because?', a: 'Moon\'s gravity is 1/6 of Earth\'s' },
    { q: 'Friction opposes?', a: 'Relative motion between surfaces' }, { q: 'Static friction is?', a: 'Friction before motion starts' },
    { q: 'Kinetic friction is?', a: 'Friction during motion' }, { q: 'Momentum = ?', a: 'mass × velocity' },
    { q: 'Impulse = ?', a: 'Force × time = change in momentum' }, { q: 'Work = ?', a: 'Force × displacement × cos θ' },
    { q: 'Power = ?', a: 'Work / time' }, { q: 'Kinetic energy = ?', a: '½mv²' },
    { q: 'Potential energy = ?', a: 'mgh' }, { q: 'Law of conservation of energy?', a: 'Energy cannot be created or destroyed, only converted' },
    { q: 'Centripetal force acts?', a: 'Toward centre of circular motion' }, { q: 'Centrifugal force is?', a: 'Apparent outward force in rotating frame' },
    { q: 'Terminal velocity is when?', a: 'Drag force equals gravitational force' }, { q: 'Inertia is?', a: 'Resistance of object to change in motion' },
    { q: 'Torque is?', a: 'Rotational force = Force × perpendicular distance' }, { q: 'Gravitational constant G = ?', a: '6.674 × 10⁻¹¹ Nm²/kg²' },
    { q: 'g on Earth ≈ ?', a: '9.8 m/s²' }, { q: 'Escape velocity from Earth ≈ ?', a: '11.2 km/s' },
    { q: 'Pressure = ?', a: 'Force / Area' }, { q: 'Buoyancy is?', a: 'Upward force on object in fluid' },
    { q: 'Archimedes\' Principle?', a: 'Buoyant force = weight of fluid displaced' },
    { q: 'Hooke\'s Law: F = ?', a: 'kx (spring constant × extension)' }, { q: 'Simple harmonic motion (pendulum) period depends on?', a: 'Length of pendulum and g' },
]
export function genForceMotionDojo(): GenQuestion { return genFromPool(FORCE_FACTS, '🌊') }

// ── SHOP IT UP (financial literacy) ──────────────────────────────────────────
const FINANCE_FACTS: Fact[] = [
    { q: 'Simple interest formula?', a: 'SI = P × R × T / 100' }, { q: 'Compound interest is calculated on?', a: 'Principal + accumulated interest' },
    { q: 'If I buy for ₹100, sell for ₹120 — profit?', a: '₹20 (20%)' }, { q: 'Profit percentage?', a: '(Profit/Cost) × 100' },
    { q: 'Loss percentage?', a: '(Loss/Cost) × 100' }, { q: 'Discount = ?', a: 'Marked Price − Selling Price' },
    { q: 'Selling Price = Marked Price − ?', a: 'Discount' }, { q: 'GST stands for?', a: 'Goods and Services Tax' },
    { q: 'EMI stands for?', a: 'Equated Monthly Instalment' }, { q: 'Break-even point is when?', a: 'Revenue = Total Costs (no profit or loss)' },
    { q: 'Fixed cost example?', a: 'Rent, salaries (do not change with output)' }, { q: 'Variable cost example?', a: 'Raw materials (change with output)' },
    { q: 'ROI stands for?', a: 'Return on Investment' }, { q: 'Net profit = ?', a: 'Revenue − Total expenses' },
    { q: 'Gross profit = ?', a: 'Revenue − Cost of Goods Sold (COGS)' }, { q: 'Budget surplus = ?', a: 'Income > Expenses' },
    { q: 'Budget deficit = ?', a: 'Expenses > Income' }, { q: 'Inflation of 10% means ₹100 product costs?', a: '₹110 next year' },
    { q: 'Depreciation means?', a: 'Decrease in asset value over time' }, { q: 'PPF minimum lock-in period?', a: '15 years' },
    { q: 'FD stands for?', a: 'Fixed Deposit' }, { q: 'Mutual fund pools?', a: 'Money from many investors to buy securities' },
    { q: 'Index fund tracks?', a: 'A market index (e.g., Nifty 50)' }, { q: 'Dividend is?', a: 'Share of profit paid to shareholders' },
    { q: 'Stock exchange in India?', a: 'NSE (National Stock Exchange) and BSE' }, { q: 'Sensex tracks companies listed on?', a: 'BSE (Bombay Stock Exchange)' },
    { q: 'Nifty 50 tracks?', a: 'Top 50 companies on NSE' }, { q: 'SEBI regulates?', a: 'Securities market in India' },
    { q: 'RBI stands for?', a: 'Reserve Bank of India' }, { q: 'RBI controls?', a: 'Monetary policy and banking regulation in India' },
    { q: 'Repo rate is?', a: 'Rate at which RBI lends to banks' }, { q: 'UPI stands for?', a: 'Unified Payments Interface' },
]
export function genShopItUp(): GenQuestion { return genFromPool(FINANCE_FACTS, '🛒') }
