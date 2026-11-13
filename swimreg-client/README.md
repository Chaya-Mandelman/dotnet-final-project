# SwimReg Client

ממשק React בעברית (RTL) למערכת ניהול הרשמה לחוגי שחייה. הלקוח משתמש בכל ה-API של השרת, עם מסכים נפרדים לכל תפקיד: מתאמן, מדריך ומנהל.

## מסכים לפי תפקיד

| תפקיד | נתיב | מה יש בו | Endpoints |
|---|---|---|---|
| כולם | `/login`, `/register` | התחברות והרשמה. ה-JWT נשמר ונשלח בכל בקשה ב-`Authorization: Bearer` | `POST /api/auth/login`, `POST /api/auth/register` |
| Student | `/courses` | קטלוג עם סינון (רמה, בריכה), מיון ו-**pagination אמיתי מול השרת**. המצב נשמר ב-URL | `GET /api/courses`, `GET /api/pools` |
| Student | `/courses/:id` | **מסך הפעולה על המשאב המוגבל**: מקומות פנויים, הרשמה וביטול, וטיפול ב-409 | `GET /api/courses/{id}`, `POST/GET/DELETE /api/registrations` |
| Student | `/my-registrations` | ההרשמות שלי עם דפדוף וביטול | `GET /api/registrations`, `DELETE /api/registrations/{id}` |
| Instructor | `/instructor/students` | התלמידים הרשומים לקורסים שלי, לפי קורס | `GET /api/instructors/{myId}/students` |
| Admin | `/admin/courses` | טבלת קורסים עם דפדוף וסינון, הוספה, עריכה ומחיקה. בטופס בוחרים בריכה ומדריך מרשימה | `GET/POST/PUT/DELETE /api/courses`, `GET /api/instructors` |
| Admin | `/admin/registrations` | כל ההרשמות, סינון לפי קורס, דפדוף וביטול | `GET/DELETE /api/registrations` |
| Admin | `/admin/instructors` | בחירת מדריך, התלמידים שלו, והוספת קורס חדש למדריך | `GET /api/instructors`, `GET /api/instructors/{id}/students` |
| Admin | `/admin/pools` | ניהול בריכות (CRUD) | `/api/pools` |

## טיפול ב-409: השרת והלקוח מדברים באותה שפה

כל תשובת 409 מוצגת ברכיב `ConflictCard` (`src/components/ConflictCard.tsx`):
- **ההודעה של השרת מוצגת כמו שהיא**, למשל "הקורס מלא", "המקום נתפס בינתיים, נסה שוב" או "כבר נרשמת לקורס הזה".
- יחד איתה מוצגים קוד 409 וה-`correlationId`, כדי שאפשר יהיה למצוא את הבקשה בלוג של השרת.
- **במסך הקורס**, אחרי 409 הלקוח טוען מחדש את הקורס מהשרת. המשתמש רואה את המצב האמיתי (למשל 0 מתוך 1), והכפתור ננעל.
  אם עדיין יש מקום (התנגשות concurrency), מוצג כפתור "ניסיון הרשמה נוסף".
- אותו רכיב משמש גם כשמנסים למחוק קורס עם הרשמות או בריכה עם קורסים, ובעריכת קורס שהשתנה בינתיים.

**הדגמה:** פותחים את קורס 4 ("שיעור פרטי", מקום אחד) בשני דפדפנים, עם שני מתאמנים שונים.
לוחצים "הרשמה לחוג" בראשון: מתקבל 201. לוחצים בשני, שעדיין מציג "1 מתוך 1": מוצג כרטיס ה-409 עם "הקורס מלא", והמסך מתעדכן ל-0 מתוך 1.

## שגיאות אחרות
- **400:** שגיאות השדות מ-`errors` מוצגות ליד השדה המתאים בטופס.
- **401:** ה-token נמחק, והמשתמש מועבר ל-`/login` עם ההודעה "תוקף ההתחברות פג". token שפג תוקפו (`expiresAt`) לא נשלח בכלל.
- **403:** ההודעה של השרת מוצגת. בנוסף, הניתוב בלקוח מסתיר מסכים של תפקידים אחרים.

## מבנה
```
src/lib/api.ts            קריאות לשרת, JWT, טיפוסים ומבנה השגיאה
src/lib/auth.tsx          AuthContext: המשתמש המחובר ודף הבית לפי תפקיד
src/lib/useQueryState.ts  דפדוף וסינון שנשמרים ב-URL
src/components/           AppLayout, ProtectedRoute, Pagination, ConflictCard, Modal, CourseFormModal...
src/pages/                מסכי המתאמן והמדריך
src/pages/admin/          מסכי המנהל
```

## דרישות

Node.js 20.19+ או 22.12+, שרת SwimReg ASP.NET Core פעיל ו-PostgreSQL שמכיל את נתוני ה-Seed.

## הרצה מקומית

```bash
npm install
cp .env.example .env
# עדכנו ב-.env את VITE_API_URL לכתובת השרת. בהרצה מקומית (פרופיל https של השרת): https://localhost:7254
npm run dev
```

בשרת יש לאפשר את כתובת הפיתוח של Vite (לרוב `http://localhost:5173`) ברשימת CORS. לבניית Production:

```bash
npm run build
npm run preview
```

הלקוח מאזין על פורט 5173 בלבד (`strictPort`), כי זה המקור שהשרת מאשר ב-CORS בפיתוח.

ה-token נשמר ב-`localStorage`, כפי שנדרש בפרויקט הלימודי. במערכת Production מומלץ לבחון דרך אחסון מאובטחת יותר.

## משתמשי דמו (מה-Seed של השרת)

| תפקיד | אימייל | סיסמה |
|---|---|---|
| Admin | admin@swimreg.com | `Admin123!` |
| Instructor | dana@swimreg.com / yossi@swimreg.com | `Instructor123!` |
| Student | noa@swimreg.com / itay@swimreg.com | `Student123!` |

## פריסה ל-Render (Static Site)

**הדרך המהירה (Blueprint):** ה-`render.yaml` שבשורש ה-repo `dotnet-final-project` יוצר גם את הלקוח. אחרי היצירה ממלאים את `VITE_API_URL` (שלב 4).

הדרך הידנית:

1. צרו Static Site חדש, חברו את ה-repository `dotnet-final-project`, והגדירו Root Directory: `swimreg-client`.
2. Build Command: `npm install && npm run build`.
3. Publish Directory: `dist`.
4. הגדירו `VITE_API_URL` ככתובת ה-HTTPS של השרת, ללא `/` בסוף.
5. הגדירו Rewrite: Source `/*`, Destination `/index.html`, Action `Rewrite`.
6. בצד השרת הגדירו `Cors__AllowedOrigins__0` לכתובת ה-Static Site ש-Render סיפק, ללא `/` בסוף. אם נדרש גם פיתוח מקומי, אפשר להוסיף מקור נוסף באינדקס `1`.
7. פרסו מחדש את הלקוח לאחר שינוי `VITE_API_URL`, כי Vite מטמיע אותו בזמן הבנייה.

כתובת הלקוח לאחר פריסה: `________________`

כתובת repository השרת: `________________`

## GitHub

```bash
git init
git add .
git commit -m "Initial SwimReg client"
git branch -M main
# צרו repository ריק בשם swimreg-client ב-GitHub ואז:
git remote add origin https://github.com/YOUR_USERNAME/swimreg-client.git
git push -u origin main
```

לא מתבצעת דחיפה אוטומטית ל-GitHub.
