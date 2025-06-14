# Kettlebell Pro

A modern web application for kettlebell workout planning, tracking, and functional movement screening.

## Features

- User profile management with fitness goals tracking
- Workout planning and progress tracking
- Functional Movement Screening (FMS) assessments
- Exercise library with proper technique guidance
- Responsive design for mobile and desktop

## Technologies

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Tools**: Vite, ESLint

## Installation

1. Clone the repository:

```bash
git clone https://github.com/katsa00781/undergrounkb.git
cd undergrounkb
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server:

```bash
npm run dev
```

## Database Connection

This project uses Supabase for the database. Detailed database documentation can be found in the `database.md` file.

### Testing the Connection

```bash
npm run validate:db
```

## Troubleshooting

### Profile Issues
If you encounter database schema issues with profiles, run:

```bash
./fix-profile-database.sh
```

### FMS Assessment Table Installation
To set up the FMS (Functional Movement Screen) assessment feature:

```bash
./install-fms-table.sh
```

This will guide you through the process of installing the required database table.

For detailed FMS installation instructions, see `docs/fms_installation_guide_hu.md`.

### Cache Issues
For persistent cache issues:

```bash
./reset-schema-cache.sh
```

For detailed information about fixed problems and solutions, see the `docs/database_fixes.md` file.

## License

MIT
