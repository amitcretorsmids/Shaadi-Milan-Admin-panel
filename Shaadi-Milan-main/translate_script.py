import re

file_path = 'c:\\Users\\amitk\\OneDrive\\Desktop\\creatorsMinds\\Shaadi-Milan-main\\components\\modals\\UserAddModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'label="Full Name"': 'label={formLanguage === \'hi\' ? \'पूरा नाम (Full Name)\' : \'Full Name\'}',
    'placeholder="Enter full name"': 'placeholder={formLanguage === \'hi\' ? \'पूरा नाम दर्ज करें\' : \'Enter full name\'}',

    'label="Phone Number"': 'label={formLanguage === \'hi\' ? \'फ़ोन नंबर (Phone Number)\' : \'Phone Number\'}',
    'placeholder="10-digit mobile number"': 'placeholder={formLanguage === \'hi\' ? \'10-अंकीय मोबाइल नंबर\' : \'10-digit mobile number\'}',

    'label="Email Address"': 'label={formLanguage === \'hi\' ? \'ईमेल (Email Address)\' : \'Email Address\'}',
    'placeholder="Enter email address"': 'placeholder={formLanguage === \'hi\' ? \'ईमेल दर्ज करें\' : \'Enter email address\'}',

    '<div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10\">Gender</div>': '<div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10\">{formLanguage === \'hi\' ? \'लिंग (Gender)\' : \'Gender\'}</div>',

    '<option className="bg-[var(--bg-surface)] text-[var(--text)]" value="male">Male</option>': '<option className="bg-[var(--bg-surface)] text-[var(--text)]" value="male">{formLanguage === \'hi\' ? \'पुरुष (Male)\' : \'Male\'}</option>',
    
    '<option className="bg-[var(--bg-surface)] text-[var(--text)]" value="female">Female</option>': '<option className="bg-[var(--bg-surface)] text-[var(--text)]" value="female">{formLanguage === \'hi\' ? \'महिला (Female)\' : \'Female\'}</option>',

    'label="Aadhar Number"': 'label={formLanguage === \'hi\' ? \'आधार नंबर (Aadhar Number)\' : \'Aadhar Number\'}',
    
    'label="Date of Birth"': 'label={formLanguage === \'hi\' ? \'जन्म तिथि (Date of Birth)\' : \'Date of Birth\'}',

    'placeholder="Enter Police station"': 'placeholder={formLanguage === \'hi\' ? \'पुलिस स्टेशन दर्ज करें\' : \'Enter Police station\'}',
    
    'placeholder="Enter 6-digit PIN"': 'placeholder={formLanguage === \'hi\' ? \'6-अंकीय पिन दर्ज करें\' : \'Enter 6-digit PIN\'}',
    
    'placeholder="Enter post office"': 'placeholder={formLanguage === \'hi\' ? \'पोस्ट ऑफिस दर्ज करें\' : \'Enter post office\'}',
    
    'placeholder="Enter your village, street, or locality"': 'placeholder={formLanguage === \'hi\' ? \'अपना गांव, सड़क या मोहल्ला दर्ज करें\' : \'Enter your village, street, or locality\'}'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully')
