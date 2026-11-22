export type TaskStatus = | 'Assigned' | 'InProgress' | 'Paused' | 'Completed' | 'Skipped' | 'pending' | 'in_progress' | 'paused' | 'completed' | 'skipped';

export interface AssignmentTask {
    AssignID: number;
    TaskID?: number | null;
    TaskName: string;
    TaskType: 'General' | 'Washroom' | 'Specialized' | string;
    SpaceID: number;
    SpaceCode: string;
    SpaceName: string;
    FloorName: string;
    BlockName: string;
    EstimatedDuration: number; // in minutes
    Status: string;
    StartTime: string | null; // e.g. "09:00:00"
    EndTime: string | null;   // e.g. "09:30:00" (Adjusted end time stored in DB)
    RawEndTime?: string | null; // e.g. "09:35:00" (Physical completion time before pause deduction)
    TotalPauseSeconds?: number;
    CleanRating?: number | null;
    Notes?: string;
}

export type CleanerTaskItem = AssignmentTask;

export interface SpaceGroup {
    SpaceID: number;
    SpaceCode: string;
    SpaceName: string;
    FloorName: string;
    BlockName: string;
    QRCode?: string | null;
    tasks: AssignmentTask[];
}

export type CleanerSpaceGroup = SpaceGroup;

export interface CleanerScheduleDetailResponse {
    ScheduleDate: string;
    ZoneCode?: string | null;
    ZoneName?: string | null;
    isToday: boolean;
    isAttended: boolean;
    totalTasks: number;
    completedTasks: number;
    spaces: SpaceGroup[];
}

export interface AssignmentUpdatePayload {
    Status?: string;
    StartTime?: string | null;
    EndTime?: string | null;
    CleanRating?: number | null;
}

export interface ClockInResponse {
    status: string;
    message: string;
    AttendanceID?: number;
    AttendanceDate?: string;
    ClockInTime?: string | null;
}

export interface TaskStepGuide {
    steps: {
        stepNumber: number;
        title: string;
        description: string;
    }[];
    requirements: string[];
    expectations: string[];
    safetyNotes: string[];
}

/**
 * Standard SOP Guide dictionary for cleaning tasks.
 */
export const TASK_GUIDES: Record<string, TaskStepGuide> = {
    Washroom: {
        steps: [
            {
                stepNumber: 1,
                title: 'Persediaan & Papan Tanda',
                description: 'Pasang papan tanda "Lantai Licin / Pembersihan Dijalankan" di luar pintu masuk tandas. Pakai sarung tangan getah dan apron kalis air.',
            },
            {
                stepNumber: 2,
                title: 'Pengosongan Tong & Sanitasi Mangkuk Tandas',
                description: 'Kosongkan tong tuala wanita dan tong sampah umum. Sembur pencuci disinfektan ke dalam mangkuk tandas & urinal, biarkan bertindak selama 5 minit.',
            },
            {
                stepNumber: 3,
                title: 'Pembersihan Sinki & Cermin',
                description: 'Sental sinki, pili air dan lap cermin menggunakan kain mikrofiber serta pencuci kaca sehingga kering dan berkilat tanpa kesan cap jari.',
            },
            {
                stepNumber: 4,
                title: 'Memberus Mangkuk & Dinding',
                description: 'Gunakan berus mangkuk tandas untuk menyental bahagian dalam mangkuk dan flush. Lap tempat duduk tandas dengan cecair disinfektan.',
            },
            {
                stepNumber: 5,
                title: 'Mop Lantai & Isi Semula Bekalan',
                description: 'Mop lantai bermula dari sudut paling dalam menuju ke pintu keluar. Isi semula sabun pencuci tangan, tisu tandas, dan sembur pewangi.',
            },
        ],
        requirements: [
            'Sarung tangan getah kalis kimia (Kuning / Biru)',
            'Kasut getah kalis gelincir / Boot keselamatan',
            'Pencuci mangkuk tandas berasaskan asid ringan / disinfektan',
            'Kain mikrofiber (Warna Merah untuk tandas, Biru untuk cermin)',
            'Mop lantai & baldi beroda (Sistem dual-bucket)',
            'Plastik sampah gred tebal & cecair sabun tangan refill',
        ],
        expectations: [
            'Mangkuk tandas bersih, tiada kerak atau bau yang tidak menyenangkan',
            'Cermin dan kelengkapan krom bebas tompokan air dan berkilat',
            'Lantai kering sekata dan tidak licin apabila dibuka untuk kegunaan',
            'Bekalan sabun tangan dan tisu sentiasa penuh',
            'Tong sampah dialas plastik bersih dan tidak melebihi paras separuh',
        ],
        safetyNotes: [
            'Jangan campurkan peluntur klorin dengan pencuci berasaskan asid (boleh menghasilkan gas beracun).',
            'Pastikan sistem pengudaraan (exhaust fan) beroperasi sepanjang masa pembersihan.',
            'Segera lap sebarang tumpahan air sabun yang pekat bagi mengelakkan kemalangan gelincir.',
        ],
    },
    General: {
        steps: [
            {
                stepNumber: 1,
                title: 'Pengudaraan & Pemeriksaan Awal',
                description: 'Buka langsir atau hidupkan lampu. Semak jika terdapat sebarang kerosakan fizikal atau barangan tertinggal sebelum memulakan pembersihan.',
            },
            {
                stepNumber: 2,
                title: 'Pengosongan Tong Sampah',
                description: 'Kumpul semua sisa sampah daripada tong meja, gantikan beg plastik sampah baharu, dan ikat beg lama dengan kemas.',
            },
            {
                stepNumber: 3,
                title: 'Mengelap Habuk Permukaan (High to Low dusting)',
                description: 'Lap permukaan bermula dari rak tinggi ke meja kerja, monitor komputer (kain kering), papan suis, dan tombol pintu dengan disinfektan.',
            },
            {
                stepNumber: 4,
                title: 'Sapu & Vakum Karpet / Lantai',
                description: 'Sapu lantai di bawah meja kerja dan bucu bilik. Jika berkarpet, gunakan pembersih vakum secara sistematik.',
            },
            {
                stepNumber: 5,
                title: 'Mop & Penyelarasan Perabot',
                description: 'Mop lantai dengan cecair pembersih serbaguna yang harum. Susun semula kerusi ke posisi asal dan tutup suis lampu/pendingin hawa jika kosong.',
            },
        ],
        requirements: [
            'Kain mikrofiber warna hijau (perabot/meja) dan kuning (habuk am)',
            'Penyapu berbulu lembut dan penyodok getah',
            'Pencuci lantai neutral / serbaguna (Multi-surface cleaner)',
            'Mop mikrofiber leper (Flat mop)',
            'Sarung tangan kain atau nitril',
        ],
        expectations: [
            'Semua permukaan meja dan perabot bebas dari lapisan habuk dan kotoran',
            'Dokumen di atas meja tidak diusik atau diubah susunannya',
            'Lantai bersih tanpa rambut, habuk, atau kesan comot',
            'Kerusi tersusun rapi di bawah meja',
        ],
        safetyNotes: [
            'Jangan gunakan kain basah pada kabel elektrik, soket dinding, atau peralatan elektronik.',
            'Gunakan teknik mengangkat yang betul apabila mengalihkan tong sampah berat atau kerusi.',
        ],
    },
    Specialized: {
        steps: [
            {
                stepNumber: 1,
                title: 'Pembersihan Kaca & Tirai',
                description: 'Sembur larutan pembersih kaca pada panel tingkap. Gunakan squeegee getah dari atas ke bawah untuk hasil tanpa kesan garisan.',
            },
            {
                stepNumber: 2,
                title: 'Pembersihan Mendalam Papan Putih / Projektor',
                description: 'Gunakan cecair khas papan putih untuk menanggalkan kesan dakwat kekal (ghosting) dan bersihkan dulang pemadam.',
            },
            {
                stepNumber: 3,
                title: 'Sanitasi Peralatan Audio-Visual',
                description: 'Lap mikrofon bilik mesyuarat, papan kekunci kawalan AV, dan suis utama menggunakan kain mikrofiber lembap beralkohol 70%.',
            },
            {
                stepNumber: 4,
                title: 'Pembersihan Lantai Intensif & Bau',
                description: 'Mop basah diikuti mop kering serta semburan pewangi aerosol automatik bagi kesegaran bilik mesyuarat rasmi.',
            },
        ],
        requirements: [
            'Squeegee tingkap & pencuci kaca gred profesional',
            'Pembersih whiteboard conditioner',
            'Tisu disinfektan alkohol 70%',
            'Pewangi aromaterapi bilik mesyuarat',
        ],
        expectations: [
            'Cermin kaca bilik telus sepenuhnya tanpa bayang kelabu atau wap',
            'Papan putih bersih berkilat sedia untuk sesi mesyuarat berikutnya',
            'Ruang berbau segar dan suasana profesional terjaga',
        ],
        safetyNotes: [
            'Gunakan tangga keselamatan yang disahkan jika mencapai bahagian tingkap tinggi.',
            'Jangan sembur cecair pembersih secara terus ke dalam lensa projektor.',
        ],
    },
    Sanitization: {
        steps: [
            {
                stepNumber: 1,
                title: 'Persediaan Cecair Disinfeksi Hospital-Grade',
                description: 'Bancuh cecair disinfektan mengikut sukatan nisbah yang ditetapkan oleh pengilang (PPM tepat).',
            },
            {
                stepNumber: 2,
                title: 'Lap Sentuhan Kerap (High-Touch Surfaces)',
                description: 'Fokus pada tombol pintu, pemegang tangga, butang lif, suis lampu dan kaunter hadapan.',
            },
            {
                stepNumber: 3,
                title: 'Tempoh Basah (Contact Time)',
                description: 'Biarkan permukaan basah selama sekurang-kurangnya 3 minit untuk memastikan pembasmian kuman 99.9%.',
            },
        ],
        requirements: [
            'Pelitup muka N95 / KN95',
            'Sarung tangan nitril sekali guna',
            'Disinfektan quaternary ammonium / hidrogen peroksida',
        ],
        expectations: [
            'Semua tombol pintu dan pegangan tangga telah disanitasi menyeluruh',
            'Tiada sisa lekatan melekit tertinggal pada tombol',
        ],
        safetyNotes: [
            'Buang sarung tangan sekali guna ke dalam tong sisa biohazard selepas selesai.',
        ],
    },
};

/**
 * Standard suggested QR Code JSON structure for space doors/locations.
 */
export interface SpaceQRCodePayload {
    app: 'ebersih';
    version: '1.0';
    type: 'space';
    space_code: string;
    space_name: string;
    zone?: string;
    floor?: string;
    block?: string;
}
