import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv()

client = boto3.client(
    'bedrock-runtime',
    aws_access_key_id=os.getenv('VITE_AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('VITE_AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

def embed(text):
    resp = client.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({'inputText': text, 'dimensions': 256, 'normalize': True})
    )
    return json.loads(resp['body'].read())['embedding']

chunks = [
    {
        'id': 'phys-elec-001',
        'title': "Ohm's Law & Electrical Resistance",
        'topic': "Ohm's Law",
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'textbook',
        'source': 'NCERT Chapter 12: Electricity, Page 81-83',
        'content': """Ohm's Law: The electric current (I) flowing through a metallic conductor is directly proportional to the potential difference (V) applied across its ends, provided its temperature and other physical conditions remain constant.
Mathematical Formula: V = I * R, where V is potential difference in Volts (V), I is current in Amperes (A), and R is resistance in Ohms (Ω).
Resistance is the property of a conductor to resist the flow of electric charges.
1 Ohm Definition: If a potential difference of 1 Volt across the two ends of a conductor causes a current of 1 Ampere to flow through it, the resistance of the conductor is 1 Ohm (1 Ω = 1 V / 1 A).
Critical Exam Note: You MUST state 'at constant temperature'. Skipping this in definitions loses 1 mark in official exam evaluations.""",
    },
    {
        'id': 'phys-elec-002',
        'title': 'Factors Affecting Resistance & Resistivity',
        'topic': 'Resistance & Resistivity',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'textbook',
        'source': 'NCERT Chapter 12: Electricity, Page 84-86',
        'content': """Factors on which the resistance of a conductor depends:
1. Directly proportional to the length of the conductor (l): R ∝ l. Doubling length doubles resistance.
2. Inversely proportional to the area of cross-section (A): R ∝ 1/A. Thicker wire has less resistance.
3. Nature of the material (Resistivity, ρ): R = ρ * (l / A).
4. Temperature: Resistance of pure metals increases with increase in temperature.
Resistivity (ρ): Specific resistance of the material of a conductor. Formula: ρ = (R * A) / l. SI unit of resistivity is Ohm-meter (Ω·m).
Resistivity depends ONLY on the material and temperature, NOT on length or thickness. Metals and alloys have low resistivity (10^-8 to 10^-6 Ω·m). Insulators have high resistivity (10^12 to 10^17 Ω·m).""",
    },
    {
        'id': 'phys-elec-003',
        'title': 'Resistors in Series Combination',
        'topic': 'Series Circuits',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'textbook',
        'source': 'NCERT Chapter 12: Electricity, Page 88-89',
        'content': """Resistors in Series:
When two or more resistors are joined end-to-end, they are said to be connected in series.
Key Properties of Series Circuit:
1. The electric current (I) is IDENTICAL through every resistor: I_total = I_1 = I_2 = I_3.
2. The total potential difference (V) is the sum of potential differences across individual resistors: V = V_1 + V_2 + V_3.
3. Equivalent Resistance Formula: R_s = R_1 + R_2 + R_3 + ... + R_n.
The equivalent resistance of a series combination is always GREATER than the greatest individual resistance in the combination.
Disadvantage: If one component breaks or fails, the whole circuit is broken and none of the appliances work.""",
    },
    {
        'id': 'phys-elec-004',
        'title': 'Resistors in Parallel Combination & Domestic Wiring',
        'topic': 'Parallel Circuits',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'textbook',
        'source': 'NCERT Chapter 12: Electricity, Page 90-92',
        'content': """Resistors in Parallel:
When resistors are connected between two common points, they are in parallel.
Key Properties of Parallel Circuit:
1. The potential difference (V) across each resistor is EQUAL to the battery voltage: V_1 = V_2 = V_3 = V.
2. The total current (I) divides into branches: I = I_1 + I_2 + I_3.
3. Equivalent Resistance Formula: 1 / R_p = 1 / R_1 + 1 / R_2 + 1 / R_3.
The equivalent resistance of parallel resistors is always SMALLER than the smallest individual resistance.
Why Domestic Circuits Are Connected in Parallel:
1. Each appliance gets the full supply voltage (e.g., 220V in household mains).
2. Each appliance can be operated independently with its own on/off switch.
3. If one appliance fuses or fails, other appliances continue to work unaffected.
4. Total resistance decreases, allowing sufficient current for high-power devices.""",
    },
    {
        'id': 'phys-elec-005',
        'title': "Joule's Law of Heating Effect",
        'topic': 'Heating Effect of Current',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'textbook',
        'source': 'NCERT Chapter 12: Electricity, Page 93-95',
        'content': """Joule's Law of Heating states that the heat (H) produced in a resistor is:
1. Directly proportional to the square of current for a given resistance: H ∝ I^2.
2. Directly proportional to the resistance for a given current: H ∝ R.
3. Directly proportional to the time for which current flows: H ∝ t.
Formula: H = I^2 * R * t = V * I * t = (V^2 / R) * t.
Unit: Joules (J).
Practical Applications:
- Electric iron, toaster, oven, geyser: Use heating elements made of alloys like Nichrome (high resistivity and high melting point, does not oxidize easily).
- Electric bulb: Filament is made of Tungsten (very high melting point: 3380 °C). Bulbs are filled with chemically inactive nitrogen and argon gas to prolong filament life.
- Electric Fuse: Safety device made of lead-tin alloy with a low melting point. If excessive current flows, Joule heating melts the wire and breaks the circuit.""",
    },
    {
        'id': 'phys-elec-006',
        'title': 'Electric Power & Commercial Unit of Energy',
        'topic': 'Electric Power & kWh',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'textbook',
        'source': 'NCERT Chapter 12: Electricity, Page 96-98',
        'content': """Electric Power: The rate at which electric energy is consumed or dissipated in an electrical circuit.
Formulae for Electric Power (P):
1. P = V * I
2. P = I^2 * R
3. P = V^2 / R
SI Unit of Power: Watt (W). 1 Watt = 1 Volt * 1 Ampere = 1 Joule / second.
Larger Unit: 1 Kilowatt (kW) = 1,000 W. 1 Megawatt (MW) = 1,000,000 W.
Commercial Unit of Electrical Energy:
The commercial unit is kilowatt-hour (kWh), commonly known as 'Board of Trade Unit' or 'Unit'.
1 kWh = 1 kW * 1 hour = 1000 W * 3600 seconds = 3.6 * 10^6 Joules (3.6 MJ).
Formula for energy consumed: Energy (kWh) = Power (kW) * Time (hours).""",
    },
    {
        'id': 'phys-elec-007',
        'title': '2023 Board Exam Question: V-I Graph Analysis (3 Marks)',
        'topic': "Ohm's Law V-I Graph",
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'past_paper',
        'source': 'CBSE Class 10 Board Exam 2023 (Set 1, Q24 - 3 Marks)',
        'content': """Question (2023 Exam):
The V-I graphs for two resistors A and B are shown with V on the Y-axis and I on the X-axis. Resistor A has a steeper slope than resistor B.
(a) Which of the two resistors has a larger resistance? Explain.
(b) If these two resistors are connected in (i) series and (ii) parallel, in which case will the equivalent resistance be higher?
Official Marking Scheme Solution:
(a) [1.5 Marks] From Ohm's law, V = I * R => R = V / I. When V is on the Y-axis and I is on the X-axis, the slope of the V-I graph equals Resistance (Slope = ΔV / ΔI = R). Since the slope for resistor A is greater than resistor B, Resistor A has a larger resistance (R_A > R_B).
(b) [1.5 Marks] The equivalent resistance is higher in SERIES combination (R_series = R_A + R_B), because in series resistances add up directly, resulting in an equivalent resistance greater than the individual maximum.""",
    },
    {
        'id': 'phys-elec-008',
        'title': '2022 Board Exam Question: Tungsten Filament & Heating Alloys (3 Marks)',
        'topic': 'Materials for Electric Heating',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'past_paper',
        'source': 'CBSE Class 10 Term 2 Board Exam 2022 (Q12 - 3 Marks)',
        'content': """Question (2022 Exam):
Give scientific reasons for the following:
(a) Why is tungsten used almost exclusively for filament of electric lamps?
(b) Why are the conductors of electric heating devices (such as toasters and irons) made of an alloy rather than a pure metal?
Official Marking Scheme Answer:
(a) [1.5 Marks] Tungsten is used because:
1. It has an exceptionally high melting point (3380 °C), allowing it to heat to high temperatures and glow white-hot without melting.
2. It has high electrical resistivity and high thermal endurance.
(b) [1.5 Marks] Heating elements are made of alloys (like Nichrome) rather than pure metals because:
1. Alloys have higher electrical resistivity than their constituent pure metals, producing more heat for the same current (H = I^2 * R * t).
2. Alloys do not oxidize (burn) easily even at high temperatures (red-hot stage).""",
    },
    {
        'id': 'phys-elec-009',
        'title': '2021 Sample Paper Question: Energy Consumption & Cost Calculation (3 Marks)',
        'topic': 'Household Energy Calculations',
        'chapter': 'Electricity',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'docType': 'past_paper',
        'source': 'CBSE Sample Question Paper 2021 (Q18 - 3 Marks)',
        'content': """Question (2021 Sample Paper):
An electric refrigerator rated 400 W operates 8 hours/day and two electric fans of 80 W each operate 10 hours/day. Calculate the total cost of energy to operate them for 30 days at the rate of Rs 4.50 per kWh.
Official Step-by-Step Marking Scheme Solution:
Step 1: Energy consumed by refrigerator in 1 day:
E_1 = 400 W * 8 h = 3200 Wh = 3.2 kWh [1 Mark]
Step 2: Energy consumed by 2 fans in 1 day:
E_2 = (2 * 80 W) * 10 h = 1600 Wh = 1.6 kWh [1 Mark]
Step 3: Total energy consumed in 1 day = 3.2 + 1.6 = 4.8 kWh
Total energy consumed in 30 days = 4.8 kWh * 30 = 144 kWh (units) [0.5 Mark]
Step 4: Total electricity bill cost = 144 kWh * Rs 4.50 = Rs 648.00 [0.5 Mark]
Common Student Mistake: Forgetting to multiply by the number of appliances (2 fans) or forgetting to convert Watt-hours to Kilowatt-hours (divide by 1000).""",
    }
]

print(f"Embedding {len(chunks)} knowledge chunks with Amazon Titan v2...")
for c in chunks:
    text_to_embed = f"{c['title']} | {c['topic']} | {c['docType']}\n{c['content']}"
    c['vector'] = embed(text_to_embed)
    print(f"✓ Embedded: {c['id']} - {c['title']}")

os.makedirs('src/data/knowledgePacks', exist_ok=True)
output_path = 'src/data/knowledgePacks/grade10PhysicsElectricity.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump({
        'packId': 'grade10-physics-electricity',
        'name': 'Grade 10 Physics: Electricity & Circuits',
        'subject': 'Physics',
        'grade': 'Grade 10',
        'curriculum': 'CBSE / NCERT / IGCSE',
        'chapter': 'Electricity',
        'totalChunks': len(chunks),
        'chunks': chunks
    }, f, indent=2)

print(f"Successfully exported Knowledge Pack to {output_path}!")
