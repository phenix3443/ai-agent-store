// Desktop UI translations. Each locale mirrors the same nested key structure;
// missing keys fall back to Chinese (see resolve() in ./index.tsx). Grown
// incrementally as components are externalized.

export const LOCALES = ['zh', 'en', 'ja', 'ko', 'es'] as const
export type Locale = (typeof LOCALES)[number]

type Dict = Record<string, unknown>

const zh: Dict = {
  overview: { trend: '消耗趋势', trendSub: '用量数据统计', today: '今日', last7: '近 7 天', last30: '近 30 天', totalCost: '总费用', totalTokens: '总 Tokens', totalRequests: '总请求数', modelCount: '模型分布', running: '运行中', stopped: '已停止', listenAddr: '监听地址', todayRequests: '今日请求', successRate: '成功率', recentRequests: '最近请求', viewAll: '查看全部', fallback: '（降级）', updatesAvailable: '可更新', all: '全部', update: '更新' },
  pro: {
    budget: { title: '预算与超支告警', desc: '设置月度消费预算，实时追踪本月花费、月末预测与超支提醒，并可导出账单。' },
    smartRouting: { title: '智能路由', desc: '多上游自动故障转移，主动避开正在冷却/限流的供应商，健康恢复后自动切回。Free 版为最多两路的基础降级。' },
    keyRotation: { title: '多 Key 轮换', desc: '为同一供应商配置多把密钥，Pro 会在请求之间轮换使用以分摊限流。' },
  },
  common: { install: '安装', installed: '已安装', cancel: '取消', save: '保存', saving: '保存中…', saved: '已保存', currentPrefix: '当前：' },
  nav: { store: '商店', overview: '概览', settings: '设置' },
  categories: { provider: '供应商', skill: '技能', mcp: 'MCP' },
  window: { close: '关闭', minimize: '最小化', maximize: '最大化' },
  settings: {
    title: '设置',
    close: '关闭',
    tabs: { account: '账户', general: '通用', about: '关于' },
    account: {
      notSignedIn: '未登录',
      signedIn: '已登录',
      disconnected: '未连接',
      logout: '退出登录',
      githubLogin: 'GitHub 登录',
      plan: '订阅计划',
      planPro: 'Pro · 无限私有资源 + 高级用量分析',
      planFree: 'Free · 升级解锁预算告警等 Pro 功能',
      upgrade: '升级 Pro',
      notConfigured: '登录未配置：缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。',
      hint: '登录后可发布私有资源、跨设备同步已安装的技能 / MCP / 供应商 / 插件，并接收更新推送。',
    },
    general: { theme: '主题', dark: '暗色', light: '亮色', toggle: '切换', targetApp: '默认目标应用', language: '界面语言', languageSub: '选择界面显示语言' },
    about: { subtitle: 'registry client', docs: '文档', github: 'GitHub', checkUpdates: '检查更新', checking: '检查中…', upToDate: '已是最新', updatesSuffix: '个可更新', checkFailed: '检查失败' },
  },
}

const en: Dict = {
  overview: { trend: 'Usage trend', trendSub: 'Usage statistics', today: 'Today', last7: 'Last 7 days', last30: 'Last 30 days', totalCost: 'Total cost', totalTokens: 'Total tokens', totalRequests: 'Total requests', modelCount: 'Models', running: 'Running', stopped: 'Stopped', listenAddr: 'Listen address', todayRequests: "Today's requests", successRate: 'Success rate', recentRequests: 'Recent requests', viewAll: 'View all', fallback: ' (fallback)', updatesAvailable: 'Updates', all: 'All', update: 'Update' },
  pro: {
    budget: { title: 'Budget & overspend alerts', desc: 'Set a monthly spend budget with real-time tracking, month-end forecasts, overspend alerts, and billing export.' },
    smartRouting: { title: 'Smart routing', desc: 'Automatic failover across upstreams, proactively avoiding cooling/rate-limited providers and switching back when healthy. Free is basic two-upstream failover.' },
    keyRotation: { title: 'Key rotation', desc: 'Configure multiple keys per provider; Pro rotates across them per request to spread rate limits.' },
  },
  common: { install: 'Install', installed: 'Installed', cancel: 'Cancel', save: 'Save', saving: 'Saving…', saved: 'Saved', currentPrefix: 'Current: ' },
  nav: { store: 'Store', overview: 'Overview', settings: 'Settings' },
  categories: { provider: 'Providers', skill: 'Skills', mcp: 'MCP' },
  window: { close: 'Close', minimize: 'Minimize', maximize: 'Maximize' },
  settings: {
    title: 'Settings',
    close: 'Close',
    tabs: { account: 'Account', general: 'General', about: 'About' },
    account: {
      notSignedIn: 'Not signed in',
      signedIn: 'Signed in',
      disconnected: 'Disconnected',
      logout: 'Log out',
      githubLogin: 'Sign in with GitHub',
      plan: 'Subscription',
      planPro: 'Pro · unlimited private items + advanced analytics',
      planFree: 'Free · upgrade to unlock budget alerts and more',
      upgrade: 'Upgrade to Pro',
      notConfigured: 'Sign-in not configured: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
      hint: 'Sign in to publish private items, sync your installed skills / MCP / providers / plugins across devices, and get update notifications.',
    },
    general: { theme: 'Theme', dark: 'Dark', light: 'Light', toggle: 'Toggle', targetApp: 'Default target app', language: 'Language', languageSub: 'Choose the interface language' },
    about: { subtitle: 'registry client', docs: 'Docs', github: 'GitHub', checkUpdates: 'Check for updates', checking: 'Checking…', upToDate: 'Up to date', updatesSuffix: 'update(s) available', checkFailed: 'Check failed' },
  },
}

const ja: Dict = {
  overview: { trend: '使用状況の推移', trendSub: '使用統計', today: '今日', last7: '過去7日', last30: '過去30日', totalCost: '合計費用', totalTokens: '合計トークン', totalRequests: '合計リクエスト', modelCount: 'モデル数', running: '稼働中', stopped: '停止', listenAddr: '待受アドレス', todayRequests: '今日のリクエスト', successRate: '成功率', recentRequests: '最近のリクエスト', viewAll: 'すべて表示', fallback: '（フォールバック）', updatesAvailable: '更新あり', all: 'すべて', update: '更新' },
  pro: {
    budget: { title: '予算と超過アラート', desc: '月次予算を設定し、当月の支出をリアルタイム追跡。月末予測・超過アラート・請求エクスポートに対応。' },
    smartRouting: { title: 'スマートルーティング', desc: '複数アップストリーム間の自動フェイルオーバー。冷却/レート制限中のプロバイダーを回避し、回復後に自動復帰。Freeは最大2系統の基本フェイルオーバー。' },
    keyRotation: { title: 'キーローテーション', desc: '同一プロバイダーに複数のキーを設定し、Proがリクエストごとに切り替えてレート制限を分散します。' },
  },
  common: { install: 'インストール', installed: 'インストール済み', cancel: 'キャンセル', save: '保存', saving: '保存中…', saved: '保存しました', currentPrefix: '現在：' },
  nav: { store: 'ストア', overview: '概要', settings: '設定' },
  categories: { provider: 'プロバイダー', skill: 'スキル', mcp: 'MCP' },
  window: { close: '閉じる', minimize: '最小化', maximize: '最大化' },
  settings: {
    title: '設定',
    close: '閉じる',
    tabs: { account: 'アカウント', general: '一般', about: '情報' },
    account: {
      notSignedIn: '未ログイン',
      signedIn: 'ログイン済み',
      disconnected: '未接続',
      logout: 'ログアウト',
      githubLogin: 'GitHub でログイン',
      plan: 'サブスクリプション',
      planPro: 'Pro · プライベート項目無制限 + 高度な分析',
      planFree: 'Free · アップグレードで予算アラートなどを解放',
      upgrade: 'Pro にアップグレード',
      notConfigured: 'ログイン未設定：VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY がありません。',
      hint: 'ログインすると、プライベート項目の公開、インストール済みのスキル / MCP / プロバイダー / プラグインのデバイス間同期、更新通知が利用できます。',
    },
    general: { theme: 'テーマ', dark: 'ダーク', light: 'ライト', toggle: '切り替え', targetApp: '既定の対象アプリ', language: '言語', languageSub: '表示言語を選択' },
    about: { subtitle: 'registry client', docs: 'ドキュメント', github: 'GitHub', checkUpdates: '更新を確認', checking: '確認中…', upToDate: '最新です', updatesSuffix: '件の更新', checkFailed: '確認に失敗' },
  },
}

const ko: Dict = {
  overview: { trend: '사용량 추이', trendSub: '사용 통계', today: '오늘', last7: '최근 7일', last30: '최근 30일', totalCost: '총 비용', totalTokens: '총 토큰', totalRequests: '총 요청', modelCount: '모델 수', running: '실행 중', stopped: '중지됨', listenAddr: '수신 주소', todayRequests: '오늘 요청', successRate: '성공률', recentRequests: '최근 요청', viewAll: '전체 보기', fallback: '(폴백)', updatesAvailable: '업데이트', all: '전체', update: '업데이트' },
  pro: {
    budget: { title: '예산 및 초과 알림', desc: '월 예산을 설정하고 이번 달 지출을 실시간 추적하며 월말 예측·초과 알림·청구 내보내기를 제공합니다.' },
    smartRouting: { title: '스마트 라우팅', desc: '여러 업스트림 간 자동 장애 조치로 냉각/속도 제한 중인 제공자를 회피하고 정상화되면 자동 복귀합니다. Free는 최대 2개 업스트림 기본 장애 조치입니다.' },
    keyRotation: { title: '키 로테이션', desc: '한 제공자에 여러 키를 설정하면 Pro가 요청마다 번갈아 사용해 속도 제한을 분산합니다.' },
  },
  common: { install: '설치', installed: '설치됨', cancel: '취소', save: '저장', saving: '저장 중…', saved: '저장됨', currentPrefix: '현재: ' },
  nav: { store: '스토어', overview: '개요', settings: '설정' },
  categories: { provider: '제공자', skill: '스킬', mcp: 'MCP' },
  window: { close: '닫기', minimize: '최소화', maximize: '최대화' },
  settings: {
    title: '설정',
    close: '닫기',
    tabs: { account: '계정', general: '일반', about: '정보' },
    account: {
      notSignedIn: '로그인 안 됨',
      signedIn: '로그인됨',
      disconnected: '연결 안 됨',
      logout: '로그아웃',
      githubLogin: 'GitHub로 로그인',
      plan: '구독',
      planPro: 'Pro · 무제한 비공개 항목 + 고급 분석',
      planFree: 'Free · 업그레이드로 예산 알림 등 잠금 해제',
      upgrade: 'Pro로 업그레이드',
      notConfigured: '로그인 미설정: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 없음.',
      hint: '로그인하면 비공개 항목 게시, 설치된 스킬 / MCP / 제공자 / 플러그인의 기기 간 동기화, 업데이트 알림을 사용할 수 있습니다.',
    },
    general: { theme: '테마', dark: '다크', light: '라이트', toggle: '전환', targetApp: '기본 대상 앱', language: '언어', languageSub: '인터페이스 언어 선택' },
    about: { subtitle: 'registry client', docs: '문서', github: 'GitHub', checkUpdates: '업데이트 확인', checking: '확인 중…', upToDate: '최신 상태', updatesSuffix: '개 업데이트', checkFailed: '확인 실패' },
  },
}

const es: Dict = {
  overview: { trend: 'Tendencia de uso', trendSub: 'Estadísticas de uso', today: 'Hoy', last7: 'Últimos 7 días', last30: 'Últimos 30 días', totalCost: 'Coste total', totalTokens: 'Tokens totales', totalRequests: 'Solicitudes totales', modelCount: 'Modelos', running: 'En ejecución', stopped: 'Detenido', listenAddr: 'Dirección de escucha', todayRequests: 'Solicitudes de hoy', successRate: 'Tasa de éxito', recentRequests: 'Solicitudes recientes', viewAll: 'Ver todo', fallback: ' (respaldo)', updatesAvailable: 'Actualizaciones', all: 'Todo', update: 'Actualizar' },
  pro: {
    budget: { title: 'Presupuesto y alertas de gasto', desc: 'Define un presupuesto mensual con seguimiento en tiempo real, previsión de fin de mes, alertas de exceso y exportación de facturación.' },
    smartRouting: { title: 'Enrutamiento inteligente', desc: 'Conmutación por error automática entre upstreams, evitando proveedores en enfriamiento/limitados y volviendo al recuperarse. Free es failover básico de dos upstreams.' },
    keyRotation: { title: 'Rotación de claves', desc: 'Configura varias claves por proveedor; Pro las rota por solicitud para repartir los límites de tasa.' },
  },
  common: { install: 'Instalar', installed: 'Instalado', cancel: 'Cancelar', save: 'Guardar', saving: 'Guardando…', saved: 'Guardado', currentPrefix: 'Actual: ' },
  nav: { store: 'Tienda', overview: 'Resumen', settings: 'Ajustes' },
  categories: { provider: 'Proveedores', skill: 'Habilidades', mcp: 'MCP' },
  window: { close: 'Cerrar', minimize: 'Minimizar', maximize: 'Maximizar' },
  settings: {
    title: 'Ajustes',
    close: 'Cerrar',
    tabs: { account: 'Cuenta', general: 'General', about: 'Acerca de' },
    account: {
      notSignedIn: 'Sin iniciar sesión',
      signedIn: 'Sesión iniciada',
      disconnected: 'Desconectado',
      logout: 'Cerrar sesión',
      githubLogin: 'Iniciar sesión con GitHub',
      plan: 'Suscripción',
      planPro: 'Pro · elementos privados ilimitados + análisis avanzado',
      planFree: 'Free · mejora para desbloquear alertas de presupuesto y más',
      upgrade: 'Mejorar a Pro',
      notConfigured: 'Inicio de sesión no configurado: falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
      hint: 'Inicia sesión para publicar elementos privados, sincronizar tus habilidades / MCP / proveedores / plugins instalados entre dispositivos y recibir avisos de actualización.',
    },
    general: { theme: 'Tema', dark: 'Oscuro', light: 'Claro', toggle: 'Cambiar', targetApp: 'App de destino por defecto', language: 'Idioma', languageSub: 'Elige el idioma de la interfaz' },
    about: { subtitle: 'registry client', docs: 'Documentación', github: 'GitHub', checkUpdates: 'Buscar actualizaciones', checking: 'Buscando…', upToDate: 'Actualizado', updatesSuffix: 'actualización(es)', checkFailed: 'Error al buscar' },
  },
}

export const messages: Record<Locale, Dict> = { zh, en, ja, ko, es }
