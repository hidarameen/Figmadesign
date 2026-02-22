import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, Calendar, X, Plus, Check, AlertCircle, Info, CheckCircle,
  FileText, Sparkles, TrendingUp, Upload, Film, Image,
  Users, Heart, Share2, MoreHorizontal, ThumbsUp, MessageCircle,
  ChevronLeft, Pencil, Trash2,
  Globe, Loader2, LayoutTemplate, Settings2, Eye,
  Clock, ArrowRight, ArrowLeft, ImagePlus, Video, Smile, Hash,
  Bookmark, Save, AlertTriangle, Play, Monitor, Smartphone,
  Zap, BarChart3, Search, Edit3, FolderOpen,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getPlatformIcon, platforms, type PlatformType } from "../PlatformIcons";
import { toast } from "sonner";

// ==================== TYPES ====================
interface MediaFile {
  id: string;
  preview: string;
  type: "image" | "video";
  name: string;
  size: string;
  altText: string;
}

interface AccountEntry {
  id: string;
  platform: PlatformType;
  username: string;
  name: string;
  followers: string;
  connected: boolean;
  verified: boolean;
}

interface PostTemplate {
  id: string;
  category: string;
  emoji: string;
  name: string;
  content: string;
  platforms: PlatformType[];
  createdAt: string;
  usageCount: number;
}

interface ScheduledPost {
  id: string;
  content: string;
  accounts: string[];
  scheduledAt: string;
  status: "pending" | "published" | "failed";
  media: number;
}

interface DraftPost {
  id: string;
  content: string;
  accounts: string[];
  savedAt: string;
  media: number;
}

type PageView = "dashboard" | "wizard" | "templates" | "scheduled" | "drafts";
type WizardStep = 1 | 2 | 3 | 4 | 5;

// ==================== CONSTANTS ====================
const PLATFORM_RULES: Record<PlatformType, {
  maxChars: number; label: string; maxImages?: number;
  maxHashtags?: number; videoOnly?: boolean; needsTitle?: boolean;
  needsBoard?: boolean; mediaRequired?: boolean; recHashtags?: string;
}> = {
  instagram: { maxChars: 2200, maxImages: 10, maxHashtags: 30, label: "Instagram", recHashtags: "5-10" },
  twitter: { maxChars: 280, maxImages: 4, maxHashtags: 2, label: "X (Twitter)", recHashtags: "1-2" },
  linkedin: { maxChars: 3000, maxImages: 9, label: "LinkedIn", recHashtags: "3-5" },
  facebook: { maxChars: 63206, label: "Facebook", recHashtags: "3-5" },
  tiktok: { maxChars: 2200, videoOnly: true, label: "TikTok" },
  youtube: { maxChars: 5000, videoOnly: true, needsTitle: true, label: "YouTube" },
  pinterest: { maxChars: 500, needsBoard: true, label: "Pinterest" },
  telegram: { maxChars: 4096, label: "Telegram" },
  whatsapp: { maxChars: 65536, label: "WhatsApp" },
  threads: { maxChars: 500, maxImages: 10, label: "Threads" },
  snapchat: { maxChars: 250, mediaRequired: true, label: "Snapchat" },
  google_business: { maxChars: 1500, label: "Google Business" },
};

const MOCK_ACCOUNTS: AccountEntry[] = [
  { id: "ig1", platform: "instagram", username: "@socialhub.sa", name: "SocialHub SA", followers: "12.5K", connected: true, verified: true },
  { id: "ig2", platform: "instagram", username: "@brand.store", name: "Brand Store", followers: "3.2K", connected: true, verified: false },
  { id: "fb1", platform: "facebook", username: "SocialHub Arabic", name: "صفحة SocialHub", followers: "45.2K", connected: true, verified: true },
  { id: "tw1", platform: "twitter", username: "@socialhub_ar", name: "SocialHub العربي", followers: "8.1K", connected: true, verified: false },
  { id: "li1", platform: "linkedin", username: "socialhub", name: "SocialHub Company", followers: "3.2K", connected: true, verified: false },
  { id: "tg1", platform: "telegram", username: "@sh_channel", name: "قناة SocialHub", followers: "22.1K", connected: true, verified: false },
  { id: "tk1", platform: "tiktok", username: "@socialhub.v", name: "SocialHub Videos", followers: "89K", connected: false, verified: false },
  { id: "yt1", platform: "youtube", username: "SocialHub", name: "قناة يوتيوب", followers: "156K", connected: true, verified: true },
  { id: "pi1", platform: "pinterest", username: "@sh_pins", name: "SocialHub Pins", followers: "5.8K", connected: true, verified: false },
  { id: "th1", platform: "threads", username: "@socialhub", name: "SocialHub Threads", followers: "4.1K", connected: true, verified: false },
  { id: "sc1", platform: "snapchat", username: "@sh_snap", name: "SocialHub Snap", followers: "7.3K", connected: true, verified: false },
  { id: "gb1", platform: "google_business", username: "SocialHub", name: "Google Business", followers: "—", connected: true, verified: true },
  { id: "wa1", platform: "whatsapp", username: "+966 50 000 0000", name: "SocialHub WhatsApp", followers: "—", connected: true, verified: false },
];

const DEFAULT_TEMPLATES: PostTemplate[] = [
  { id: "t1", category: "إعلان", emoji: "🚀", name: "إطلاق منتج جديد", content: "🚀 مفاجأة! نُطلق اليوم منتجنا الجديد!\n\n✨ ميزة أولى\n✅ ميزة ثانية\n💎 ميزة ثالثة\n\n🔗 رابط الطلب في البايو!\n\n#منتج_جديد #إطلاق #تسويق", platforms: ["instagram", "facebook", "twitter"], createdAt: "2024-01-15", usageCount: 24 },
  { id: "t2", category: "تفاعلي", emoji: "💬", name: "سؤال التفاعل", content: "سؤال اليوم 🤔\n\nما رأيك في هذا الموضوع؟\n\nأخبرنا برأيك في التعليقات! 👇\n\n#سؤال_اليوم #تفاعل", platforms: ["instagram", "facebook", "linkedin"], createdAt: "2024-01-14", usageCount: 18 },
  { id: "t3", category: "محتوى", emoji: "💡", name: "نصيحة قيّمة", content: "نصيحة اليوم 💡\n\nشارك نصيحتك هنا\n\n📌 احفظ هذه النصيحة!\n\n#نصيحة #تعلم #تطوير", platforms: ["instagram", "linkedin", "twitter"], createdAt: "2024-01-13", usageCount: 32 },
  { id: "t4", category: "ترويجي", emoji: "🎁", name: "عرض خاص", content: "🎉 عرض لفترة محدودة!\n\nخصم على الخدمة\n\n⏰ محدود الوقت!\n📞 تواصل معنا الآن!\n\n#عرض_خاص #خصومات", platforms: ["instagram", "facebook", "twitter"], createdAt: "2024-01-12", usageCount: 45 },
  { id: "t5", category: "قصة", emoji: "📖", name: "قصة نجاح", content: "قصة نجاح مُلهمة ✨\n\nرحلة بدأت من الصفر وأصبحت...\n\nالنجاح لا يأتي بالصدفة! 💪\n\n#نجاح #إلهام #رحلة", platforms: ["instagram", "linkedin", "facebook"], createdAt: "2024-01-11", usageCount: 15 },
];

const AI_SUGGESTIONS = [
  { label: "اجعله أكثر تفاعلاً", prompt: "حسّن النص ليكون أكثر تفاعلاً وجذباً للتعليقات" },
  { label: "أضف CTA قوي", prompt: "أضف دعوة للعمل واضحة وقوية في نهاية النص" },
  { label: "اجعله أكثر احترافية", prompt: "حسّن الأسلوب ليكون أكثر احترافية ومهنية" },
  { label: "أضف هاشتاغات", prompt: "أضف هاشتاغات مناسبة ومتعلقة بالموضوع" },
  { label: "اختصر النص", prompt: "اختصر النص مع الحفاظ على المعنى الأساسي" },
  { label: "ترجم للإنجليزية", prompt: "ترجم النص إلى الإنجليزية مع الحفاظ على الأسلوب" },
];

const HASHTAG_GROUPS = [
  { name: "تسويق", color: "#8B5CF6", tags: ["#تسويق_رقمي", "#سوشيال_ميديا", "#محتوى", "#إعلان", "#برند"] },
  { name: "أعمال", color: "#3B82F6", tags: ["#ريادة_أعمال", "#نجاح", "#أعمال", "#استثمار"] },
  { name: "تقنية", color: "#06B6D4", tags: ["#تقنية", "#برمجة", "#ذكاء_اصطناعي", "#ابتكار"] },
  { name: "ترفيه", color: "#F59E0B", tags: ["#ترفيه", "#مضحك", "#تحدي", "#فيديو"] },
];

// ==================== MAIN COMPONENT ====================
export function ManualPublishPage() {
  const { theme, language } = useTheme();
  const isDark = theme === "dark";
  const isRTL = language === "ar";
  const ff = isRTL ? "Cairo, sans-serif" : "Inter, sans-serif";

  const [pageView, setPageView] = useState<PageView>("dashboard");
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);

  // Wizard state
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [platformCustom, setPlatformCustom] = useState<Record<string, string>>({});
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");

  // UI state
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeHashGroup, setActiveHashGroup] = useState(0);
  const [accountFilter, setAccountFilter] = useState<PlatformType | "all">("all");
  const [previewPlatform, setPreviewPlatform] = useState<PlatformType | null>(null);
  const [inspectTab, setInspectTab] = useState<string>("");

  // Data state
  const [templates, setTemplates] = useState<PostTemplate[]>(DEFAULT_TEMPLATES);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    { id: "s1", content: "منشور مجدول للنشر على إنستغرام غداً مع عرض خاص...", accounts: ["ig1", "fb1"], scheduledAt: "2026-02-22 10:00", status: "pending", media: 2 },
    { id: "s2", content: "تحديث أسبوعي: أفضل النصائح التسويقية لهذا الأسبوع...", accounts: ["li1", "tw1"], scheduledAt: "2026-02-23 14:30", status: "pending", media: 0 },
  ]);
  const [draftPosts, setDraftPosts] = useState<DraftPost[]>([
    { id: "d1", content: "مسودة: محتوى رمضان 2026 - التخطيط المبكر للحملات...", accounts: ["ig1", "fb1", "tw1"], savedAt: "2026-02-20 16:45", media: 3 },
  ]);
  const [editingTemplate, setEditingTemplate] = useState<PostTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", category: "عام", emoji: "✨", content: "", platforms: [] as PlatformType[] });
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("الكل");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const selectedPlatforms = [...new Set(selectedAccounts.map(id => MOCK_ACCOUNTS.find(a => a.id === id)?.platform).filter(Boolean))] as PlatformType[];

  const getValidationIssues = useCallback((platform: PlatformType, content: string) => {
    const rule = PLATFORM_RULES[platform];
    const issues: { level: "error" | "warning" | "tip"; message: string }[] = [];
    const text = platformCustom[platform] || content;
    const hashCount = (text.match(/#\w+/g) || []).length;

    if (text.length > rule.maxChars) {
      issues.push({ level: "error", message: `النص يتجاوز الحد (${text.length}/${rule.maxChars} حرف)` });
    } else if (text.length > rule.maxChars * 0.9) {
      issues.push({ level: "warning", message: `النص قريب من الحد الأقصى (${text.length}/${rule.maxChars})` });
    }
    if (rule.maxHashtags && hashCount > rule.maxHashtags) {
      issues.push({ level: "error", message: `عدد الهاشتاغات يتجاوز الحد (${hashCount}/${rule.maxHashtags})` });
    }
    if (rule.recHashtags && hashCount === 0 && text.length > 0) {
      issues.push({ level: "tip", message: `ينصح بإضافة ${rule.recHashtags} هاشتاغ` });
    }
    if (rule.videoOnly && mediaFiles.filter(m => m.type === "video").length === 0) {
      issues.push({ level: "warning", message: `${rule.label} يعمل بشكل أفضل مع الفيديو` });
    }
    if (rule.needsTitle && !postTitle) {
      issues.push({ level: "error", message: "يتطلب عنواناً للمنشور" });
    }
    if (rule.mediaRequired && mediaFiles.length === 0) {
      issues.push({ level: "warning", message: "يتطلب مرفق وسائط" });
    }
    if (text.length === 0) {
      issues.push({ level: "error", message: "لا يوجد محتوى" });
    }
    return issues;
  }, [postContent, platformCustom, mediaFiles, postTitle]);

  const resetWizard = () => {
    setPostContent("");
    setPostTitle("");
    setMediaFiles([]);
    setSelectedAccounts([]);
    setPlatformCustom({});
    setScheduleDate("");
    setScheduleTime("");
    setPublishMode("now");
    setWizardStep(1);
    setShowAI(false);
    setAccountFilter("all");
    setPreviewPlatform(null);
  };

  const startWizard = (template?: PostTemplate) => {
    resetWizard();
    if (template) setPostContent(template.content);
    setPageView("wizard");
  };

  const handleAI = async (prompt: string) => {
    if (!postContent.trim()) { toast.error("اكتب محتوى أولاً"); return; }
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const improvements = [
      `${postContent}\n\n✨ تم تحسين المحتوى بواسطة الذكاء الاصطناعي!\n\n#محتوى_احترافي #تسويق_رقمي`,
      `${postContent}\n\n💡 نصيحة: شارك هذا المحتوى مع فريقك للحصول على أفضل النتائج.\n\n👇 اترك تعليقاً الآن!`,
      `${postContent}\n\n🚀 هل أنت مستعد للنجاح؟ ابدأ رحلتك اليوم!\n\n📞 تواصل معنا الآن`,
    ];
    setPostContent(improvements[Math.floor(Math.random() * improvements.length)]);
    setAiLoading(false);
    toast.success("تم تحسين المحتوى!");
  };

  const addMockMedia = (type: "image" | "video") => {
    const img: MediaFile = {
      id: `m${Date.now()}`,
      preview: type === "image"
        ? `https://picsum.photos/400/300?random=${Date.now()}`
        : "",
      type,
      name: type === "image" ? "image.jpg" : "video.mp4",
      size: type === "image" ? "1.2 MB" : "24.5 MB",
      altText: "",
    };
    setMediaFiles(prev => [...prev, img]);
  };

  const cs = (dark: string, light: string) => isDark ? dark : light;
  const card = `rounded-2xl backdrop-blur-sm ${cs("bg-slate-800/60 border border-slate-700/60", "bg-white/90 border border-slate-200/70")}`;
  const cardShadow = cs("0 4px 24px rgba(0,0,0,0.3)", "0 4px 24px rgba(0,0,0,0.07)");

  // ==================== PAGES ====================
  if (pageView === "templates") return (
    <TemplatesView
      templates={templates} setTemplates={setTemplates}
      isDark={isDark} ff={ff} cs={cs} card={card} cardShadow={cardShadow}
      onBack={() => setPageView("dashboard")}
      onUse={(t) => startWizard(t)}
      search={templateSearch} setSearch={setTemplateSearch}
      category={templateCategory} setCategory={setTemplateCategory}
      editingTemplate={editingTemplate} setEditingTemplate={setEditingTemplate}
      showModal={showTemplateModal} setShowModal={setShowTemplateModal}
      templateForm={templateForm} setTemplateForm={setTemplateForm}
    />
  );

  if (pageView === "scheduled") return (
    <ScheduledView
      posts={scheduledPosts} setPosts={setScheduledPosts}
      accounts={MOCK_ACCOUNTS} isDark={isDark} ff={ff} cs={cs} card={card} cardShadow={cardShadow}
      onBack={() => setPageView("dashboard")}
    />
  );

  if (pageView === "drafts") return (
    <DraftsView
      drafts={draftPosts} setDrafts={setDraftPosts}
      accounts={MOCK_ACCOUNTS} isDark={isDark} ff={ff} cs={cs} card={card} cardShadow={cardShadow}
      onBack={() => setPageView("dashboard")}
      onEdit={(d) => {
        setPostContent(d.content);
        setSelectedAccounts(d.accounts);
        setWizardStep(1);
        setPageView("wizard");
      }}
    />
  );

  if (pageView === "wizard") return (
    <WizardView
      step={wizardStep} setStep={setWizardStep}
      postContent={postContent} setPostContent={setPostContent}
      postTitle={postTitle} setPostTitle={setPostTitle}
      mediaFiles={mediaFiles} setMediaFiles={setMediaFiles}
      selectedAccounts={selectedAccounts} setSelectedAccounts={setSelectedAccounts}
      platformCustom={platformCustom} setPlatformCustom={setPlatformCustom}
      scheduleDate={scheduleDate} setScheduleDate={setScheduleDate}
      scheduleTime={scheduleTime} setScheduleTime={setScheduleTime}
      publishMode={publishMode} setPublishMode={setPublishMode}
      showAI={showAI} setShowAI={setShowAI}
      aiLoading={aiLoading} handleAI={handleAI}
      activeHashGroup={activeHashGroup} setActiveHashGroup={setActiveHashGroup}
      accountFilter={accountFilter} setAccountFilter={setAccountFilter}
      previewPlatform={previewPlatform} setPreviewPlatform={setPreviewPlatform}
      inspectTab={inspectTab} setInspectTab={setInspectTab}
      selectedPlatforms={selectedPlatforms}
      getValidationIssues={getValidationIssues}
      templates={templates}
      isDark={isDark} isRTL={isRTL} ff={ff} cs={cs} card={card} cardShadow={cardShadow}
      onCancel={() => { setPageView("dashboard"); resetWizard(); }}
      onSaveDraft={() => {
        if (!postContent.trim()) { toast.error("لا يوجد محتوى للحفظ"); return; }
        const draft: DraftPost = { id: `d${Date.now()}`, content: postContent, accounts: selectedAccounts, savedAt: new Date().toLocaleString("ar-SA"), media: mediaFiles.length };
        setDraftPosts(prev => [draft, ...prev]);
        toast.success("تم حفظ المسودة");
        setPageView("dashboard");
        resetWizard();
      }}
      onPublish={() => {
        if (publishMode === "schedule") {
          if (!scheduleDate || !scheduleTime) { toast.error("اختر تاريخ ووقت النشر"); return; }
          const post: ScheduledPost = { id: `s${Date.now()}`, content: postContent, accounts: selectedAccounts, scheduledAt: `${scheduleDate} ${scheduleTime}`, status: "pending", media: mediaFiles.length };
          setScheduledPosts(prev => [post, ...prev]);
          toast.success("✅ تمت الجدولة بنجاح!");
        } else {
          toast.success("🚀 تم النشر بنجاح على جميع المنصات!");
        }
        setPageView("dashboard");
        resetWizard();
      }}
      addMockMedia={addMockMedia}
      fileInputRef={fileInputRef}
    />
  );

  // ==================== DASHBOARD VIEW ====================
  const connectedCount = MOCK_ACCOUNTS.filter(a => a.connected).length;
  return (
    <div className="space-y-6" style={{ fontFamily: ff }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl mb-1 ${cs("text-white", "text-slate-800")}`}>
            النشر اليدوي
          </h1>
          <p className={`${cs("text-slate-400", "text-slate-500")}`}>
            أنشئ وجدول منشوراتك على {connectedCount} منصة متصلة
          </p>
        </div>
        <motion.button
          onClick={() => startWizard()}
          className="px-6 py-3 rounded-xl bg-violet-600 text-white flex items-center gap-2 hover:bg-violet-700 transition-all"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ boxShadow: "0 4px 20px rgba(139,92,246,0.35)" }}
        >
          <Plus className="w-5 h-5" />
          <span>إنشاء منشور جديد</span>
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "منشورات اليوم", value: "12", icon: Send, color: "violet", change: "+3" },
          { label: "مجدولة", value: scheduledPosts.length.toString(), icon: Calendar, color: "blue", change: `+${scheduledPosts.length}` },
          { label: "المسودات", value: draftPosts.length.toString(), icon: FolderOpen, color: "amber", change: "" },
          { label: "القوالب", value: templates.length.toString(), icon: LayoutTemplate, color: "emerald", change: "" },
        ].map((s, i) => (
          <motion.div key={i} className={`p-4 sm:p-5 ${card}`} style={{ boxShadow: cardShadow }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.02, y: -2 }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 text-${s.color}-500`} />
              </div>
              {s.change && <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{s.change}</span>}
            </div>
            <p className={`text-2xl mb-0.5 ${cs("text-white", "text-slate-800")}`}>{s.value}</p>
            <p className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Zap, title: "إنشاء منشور", desc: "ابدأ من الصفر بمحرر متقدم", color: "violet", gradient: "from-violet-500 to-purple-600", action: () => startWizard() },
          { icon: LayoutTemplate, title: "القوالب", desc: `${templates.length} قالب جاهز`, color: "blue", gradient: "from-blue-500 to-cyan-600", action: () => setPageView("templates") },
          { icon: Calendar, title: "المجدولة", desc: `${scheduledPosts.length} منشور مجدول`, color: "indigo", gradient: "from-indigo-500 to-blue-600", action: () => setPageView("scheduled") },
          { icon: FolderOpen, title: "المسودات", desc: `${draftPosts.length} مسودة محفوظة`, color: "amber", gradient: "from-amber-500 to-orange-500", action: () => setPageView("drafts") },
        ].map((item, i) => (
          <motion.div key={i} onClick={item.action}
            className={`p-5 rounded-2xl cursor-pointer group ${card}`}
            style={{ boxShadow: cardShadow }}
            whileHover={{ scale: 1.03, y: -4 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className={`mb-1 ${cs("text-white", "text-slate-800")}`}>{item.title}</h3>
            <p className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{item.desc}</p>
            <div className={`flex items-center gap-1 mt-3 text-${item.color}-500 text-sm`}>
              <span>فتح</span>
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Templates Quick Access */}
      <motion.div className={`p-5 ${card}`} style={{ boxShadow: cardShadow }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cs("text-white", "text-slate-800")}>قوالب سريعة</h3>
          <button onClick={() => setPageView("templates")} className="text-sm text-violet-500 hover:text-violet-400">
            عرض الكل
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {templates.slice(0, 5).map((t) => (
            <motion.button key={t.id} onClick={() => startWizard(t)}
              className={`p-3 rounded-xl text-right ${cs("bg-slate-700/50 hover:bg-slate-700 text-slate-300", "bg-slate-50 hover:bg-violet-50 text-slate-700")} transition-colors`}
              whileHover={{ scale: 1.03 }}>
              <div className="text-2xl mb-2">{t.emoji}</div>
              <p className="text-sm truncate">{t.name}</p>
              <p className={`text-xs mt-1 ${cs("text-slate-500", "text-slate-400")}`}>{t.usageCount} استخدام</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Scheduled Posts Preview */}
      {scheduledPosts.length > 0 && (
        <motion.div className={`p-5 ${card}`} style={{ boxShadow: cardShadow }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cs("text-white", "text-slate-800")}>أقرب المجدولة</h3>
            <button onClick={() => setPageView("scheduled")} className="text-sm text-violet-500 hover:text-violet-400">
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {scheduledPosts.slice(0, 2).map((post) => (
              <div key={post.id} className={`flex items-center gap-3 p-3 rounded-xl ${cs("bg-slate-700/30", "bg-slate-50")}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${cs("text-slate-300", "text-slate-700")}`}>{post.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className={`w-3 h-3 ${cs("text-slate-500", "text-slate-400")}`} />
                    <span className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>{post.scheduledAt}</span>
                    {post.accounts.slice(0, 3).map(id => {
                      const acc = MOCK_ACCOUNTS.find(a => a.id === id);
                      return acc ? <span key={id}>{getPlatformIcon(acc.platform, 14)}</span> : null;
                    })}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg">مجدول</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ==================== WIZARD VIEW ====================
interface WizardProps {
  step: WizardStep; setStep: (s: WizardStep) => void;
  postContent: string; setPostContent: (v: string) => void;
  postTitle: string; setPostTitle: (v: string) => void;
  mediaFiles: MediaFile[]; setMediaFiles: (v: MediaFile[] | ((p: MediaFile[]) => MediaFile[])) => void;
  selectedAccounts: string[]; setSelectedAccounts: (v: string[] | ((p: string[]) => string[])) => void;
  platformCustom: Record<string, string>; setPlatformCustom: (v: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void;
  scheduleDate: string; setScheduleDate: (v: string) => void;
  scheduleTime: string; setScheduleTime: (v: string) => void;
  publishMode: "now" | "schedule"; setPublishMode: (v: "now" | "schedule") => void;
  showAI: boolean; setShowAI: (v: boolean) => void;
  aiLoading: boolean; handleAI: (p: string) => void;
  activeHashGroup: number; setActiveHashGroup: (v: number) => void;
  accountFilter: PlatformType | "all"; setAccountFilter: (v: PlatformType | "all") => void;
  previewPlatform: PlatformType | null; setPreviewPlatform: (v: PlatformType | null) => void;
  inspectTab: string; setInspectTab: (v: string) => void;
  selectedPlatforms: PlatformType[];
  getValidationIssues: (p: PlatformType, c: string) => { level: string; message: string }[];
  templates: PostTemplate[];
  isDark: boolean; isRTL: boolean; ff: string;
  cs: (d: string, l: string) => string;
  card: string; cardShadow: string;
  onCancel: () => void; onSaveDraft: () => void; onPublish: () => void;
  addMockMedia: (t: "image" | "video") => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function WizardView(props: WizardProps) {
  const { step, setStep, isDark, ff, cs, card, cardShadow, onCancel, onSaveDraft, onPublish, selectedPlatforms, getValidationIssues } = props;

  const STEPS = [
    { num: 1 as WizardStep, label: "المحتوى والوسائط", icon: FileText },
    { num: 2 as WizardStep, label: "الحسابات", icon: Users },
    { num: 3 as WizardStep, label: "الفحص والتخصيص", icon: Settings2 },
    { num: 4 as WizardStep, label: "المعاينة", icon: Eye },
    { num: 5 as WizardStep, label: "النشر", icon: Send },
  ];

  const canNext = () => {
    if (step === 1) return props.postContent.trim().length > 0;
    if (step === 2) return props.selectedAccounts.length > 0;
    return true;
  };

  const allErrors = selectedPlatforms.flatMap(p => getValidationIssues(p, props.postContent).filter(i => i.level === "error"));

  return (
    <div className="space-y-5" style={{ fontFamily: ff }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 flex-wrap">
        <motion.button onClick={onCancel}
          className={`p-2 rounded-xl ${cs("bg-slate-800 text-white hover:bg-slate-700", "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200")}`}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl ${cs("text-white", "text-slate-800")}`}>إنشاء منشور جديد</h1>
          <p className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>الخطوة {step} من 5 — {STEPS[step - 1].label}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSaveDraft}
            className={`px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 ${cs("bg-slate-800 text-slate-300 hover:bg-slate-700", "bg-slate-100 text-slate-600 hover:bg-slate-200")}`}>
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">مسودة</span>
          </button>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div className={`p-3 sm:p-4 ${card}`} style={{ boxShadow: cardShadow }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center cursor-pointer
                      ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-violet-600 text-white" : cs("bg-slate-700 text-slate-400", "bg-slate-100 text-slate-400")}`}
                    animate={{ scale: isActive ? [1, 1.08, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => isDone && setStep(s.num)}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </motion.div>
                  <span className={`text-xs hidden sm:block whitespace-nowrap ${isActive ? "text-violet-500" : isDone ? "text-emerald-500" : cs("text-slate-500", "text-slate-400")}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${step > s.num ? "bg-emerald-500" : cs("bg-slate-700", "bg-slate-200")}`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && <Step1Content key="s1" {...props} />}
        {step === 2 && <Step2Accounts key="s2" {...props} />}
        {step === 3 && <Step3InspectCustomize key="s3" {...props} />}
        {step === 4 && <Step4Preview key="s4" {...props} />}
        {step === 5 && <Step5Publish key="s5" {...props} />}
      </AnimatePresence>

      {/* Nav Buttons */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <motion.button
          onClick={() => step === 1 ? onCancel() : setStep((step - 1) as WizardStep)}
          className={`px-5 py-3 rounded-xl flex items-center gap-2 ${cs("bg-slate-800 text-white hover:bg-slate-700", "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200")}`}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <ArrowRight className="w-4 h-4" />
          <span>{step === 1 ? "إلغاء" : "السابق"}</span>
        </motion.button>

        {step < 5 ? (
          <motion.button
            onClick={() => canNext() && setStep((step + 1) as WizardStep)}
            disabled={!canNext()}
            className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all
              ${canNext() ? "bg-violet-600 hover:bg-violet-700 text-white" : cs("bg-slate-700 text-slate-500 cursor-not-allowed", "bg-slate-200 text-slate-400 cursor-not-allowed")}`}
            style={canNext() ? { boxShadow: "0 4px 16px rgba(139,92,246,0.35)" } : {}}
            whileHover={canNext() ? { scale: 1.02 } : {}} whileTap={canNext() ? { scale: 0.98 } : {}}>
            <span>التالي</span>
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.button onClick={onPublish}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white flex items-center gap-2"
            style={{ boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <span>{props.publishMode === "schedule" ? "جدولة المنشور" : "نشر الآن"}</span>
            {props.publishMode === "schedule" ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ==================== STEP 1: CONTENT & MEDIA ====================
function Step1Content({ postContent, setPostContent, postTitle, setPostTitle, mediaFiles, setMediaFiles, showAI, setShowAI, aiLoading, handleAI, activeHashGroup, setActiveHashGroup, templates, isDark, ff, cs, card, cardShadow, addMockMedia, fileInputRef }: WizardProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojis = ["😀","😍","🔥","💯","🎉","🙏","❤️","✨","👍","🚀","💡","🎯","💪","🌟","👏","🤩","😎","🥳","💫","⚡","✅","❌","🏆","🎁","📣","📌","💬","📊","💰","🌈","⭐","🎨","💼","📈","🤝","📝","🗓️","⏰","🔔","📱","💻","📧"];

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-4" style={{ fontFamily: ff }}>

      {/* Title (optional) */}
      <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
        <label className={`block text-sm mb-2 ${cs("text-slate-400", "text-slate-600")}`}>
          عنوان المنشور <span className={cs("text-slate-600", "text-slate-400")}>(اختياري - مطلوب لـ YouTube)</span>
        </label>
        <input
          value={postTitle} onChange={e => setPostTitle(e.target.value)}
          placeholder="أدخل عنواناً للمنشور..."
          className={`w-full bg-transparent outline-none ${cs("text-white placeholder-slate-500", "text-slate-800 placeholder-slate-400")}`}
          style={{ fontFamily: ff }}
        />
      </div>

      {/* Editor */}
      <div className={`${card}`} style={{ boxShadow: cardShadow }}>
        {/* Toolbar */}
        <div className={`flex items-center gap-1 p-3 border-b ${cs("border-slate-700", "border-slate-200")} flex-wrap`}>
          <button onClick={() => setShowAI(!showAI)}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-sm ${showAI ? "bg-violet-600 text-white" : cs("text-violet-400 hover:bg-slate-700", "text-violet-600 hover:bg-violet-50")}`}>
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI مساعد</span>
          </button>
          <div className={`w-px h-5 ${cs("bg-slate-700", "bg-slate-200")} mx-1`} />
          <button onClick={() => addMockMedia("image")} className={`p-2 rounded-lg ${cs("text-slate-400 hover:bg-slate-700", "text-slate-600 hover:bg-slate-100")}`} title="صورة">
            <ImagePlus className="w-4 h-4" />
          </button>
          <button onClick={() => addMockMedia("video")} className={`p-2 rounded-lg ${cs("text-slate-400 hover:bg-slate-700", "text-slate-600 hover:bg-slate-100")}`} title="فيديو">
            <Video className="w-4 h-4" />
          </button>
          <button onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-lg ${cs("text-slate-400 hover:bg-slate-700", "text-slate-600 hover:bg-slate-100")}`}>
            <Smile className="w-4 h-4" />
          </button>
          <button onClick={() => setShowTemplates(!showTemplates)}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-sm ${cs("text-slate-400 hover:bg-slate-700", "text-slate-600 hover:bg-slate-100")}`}>
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">قوالب</span>
          </button>
          <div className="flex-1" />
          <span className={`text-xs ${postContent.length > 2200 ? "text-red-500" : cs("text-slate-500", "text-slate-400")}`}>
            {postContent.length} حرف
          </span>
        </div>

        {/* Emoji Panel */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`border-b ${cs("border-slate-700 bg-slate-900/50", "border-slate-200 bg-slate-50")} p-3`}>
              <div className="flex flex-wrap gap-1">
                {emojis.map((e, i) => (
                  <button key={i} onClick={() => setPostContent(prev => prev + e)}
                    className="text-lg hover:scale-125 transition-transform p-1">{e}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Templates Quick Panel */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`border-b ${cs("border-slate-700 bg-slate-900/50", "border-slate-200 bg-slate-50")} p-3`}>
              <p className={`text-xs mb-2 ${cs("text-slate-400", "text-slate-500")}`}>اختر قالباً:</p>
              <div className="flex gap-2 flex-wrap">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setPostContent(t.content); setShowTemplates(false); }}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${cs("bg-slate-800 hover:bg-slate-700 text-slate-300", "bg-white hover:bg-violet-50 text-slate-700 border border-slate-200")}`}>
                    <span>{t.emoji}</span><span>{t.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text area */}
        <div className="p-4">
          <textarea
            value={postContent} onChange={e => setPostContent(e.target.value)}
            placeholder="اكتب محتوى منشورك هنا... يمكنك استخدام مساعد الذكاء الاصطناعي لتحسين النص"
            className={`w-full min-h-[180px] bg-transparent outline-none resize-none ${cs("text-white placeholder-slate-500", "text-slate-800 placeholder-slate-400")}`}
            style={{ fontFamily: ff }}
          />
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className={`border-t ${cs("border-slate-700 bg-violet-900/20", "border-slate-200 bg-violet-50")} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className={`text-sm ${cs("text-violet-300", "text-violet-700")}`}>مساعد الذكاء الاصطناعي</span>
                {aiLoading && <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />}
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleAI(s.prompt)} disabled={aiLoading}
                    className={`px-3 py-1.5 rounded-lg text-sm ${cs("bg-slate-800 hover:bg-slate-700 text-slate-300", "bg-white hover:bg-violet-100 text-slate-700 border border-violet-200")} disabled:opacity-50 transition-colors`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hashtag Groups */}
      <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-violet-500" />
          <span className={`text-sm ${cs("text-slate-300", "text-slate-700")}`}>هاشتاغات سريعة</span>
          <div className="flex gap-1 mr-auto">
            {HASHTAG_GROUPS.map((g, i) => (
              <button key={i} onClick={() => setActiveHashGroup(i)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${activeHashGroup === i ? "text-white" : cs("text-slate-400 hover:bg-slate-700", "text-slate-600 hover:bg-slate-100")}`}
                style={activeHashGroup === i ? { backgroundColor: g.color } : {}}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {HASHTAG_GROUPS[activeHashGroup].tags.map((tag, i) => (
            <button key={i} onClick={() => setPostContent(prev => prev + " " + tag)}
              className={`px-3 py-1 rounded-lg text-sm ${cs("bg-slate-700/50 hover:bg-slate-700 text-slate-300", "bg-slate-100 hover:bg-slate-200 text-slate-700")} transition-colors`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Media Files */}
      {mediaFiles.length > 0 && (
        <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <ImagePlus className="w-4 h-4 text-blue-500" />
            <span className={`text-sm ${cs("text-slate-300", "text-slate-700")}`}>{mediaFiles.length} وسائط مرفقة</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {mediaFiles.map((m) => (
              <div key={m.id} className={`relative rounded-xl overflow-hidden ${cs("bg-slate-700", "bg-slate-100")}`}
                style={{ width: 90, height: 90 }}>
                {m.type === "image" && m.preview ? (
                  <img src={m.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className={`w-8 h-8 ${cs("text-slate-500", "text-slate-400")}`} />
                  </div>
                )}
                <button onClick={() => setMediaFiles(prev => prev.filter(x => x.id !== m.id))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
                <div className={`absolute bottom-0 left-0 right-0 text-xs px-1 py-0.5 text-center ${cs("bg-slate-900/80 text-slate-300", "bg-white/90 text-slate-600")}`}>
                  {m.size}
                </div>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors
                ${cs("border-slate-600 text-slate-500 hover:border-violet-500 hover:text-violet-400", "border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-500")}`}
              style={{ width: 90, height: 90 }}>
              <Plus className="w-5 h-5" />
              <span className="text-xs">إضافة</span>
            </button>
          </div>
        </div>
      )}

      {mediaFiles.length === 0 && (
        <button onClick={() => fileInputRef.current?.click()}
          className={`w-full p-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-3 transition-all
            ${cs("border-slate-700 text-slate-500 hover:border-violet-500 hover:text-violet-400", "border-slate-200 text-slate-400 hover:border-violet-400 hover:text-violet-500")}`}>
          <Upload className="w-8 h-8" />
          <span className="text-sm">اسحب وأفلت الوسائط أو انقر للرفع</span>
          <span className={`text-xs ${cs("text-slate-600", "text-slate-400")}`}>صور وفيديو — JPG, PNG, MP4, MOV</span>
          <div className="flex gap-2 mt-1">
            <button onClick={(e) => { e.stopPropagation(); addMockMedia("image"); }}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs flex items-center gap-1">
              <ImagePlus className="w-3 h-3" /> إضافة صورة
            </button>
            <button onClick={(e) => { e.stopPropagation(); addMockMedia("video"); }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs flex items-center gap-1">
              <Video className="w-3 h-3" /> إضافة فيديو
            </button>
          </div>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden />
    </motion.div>
  );
}

// ==================== STEP 2: SELECT ACCOUNTS ====================
function Step2Accounts({ selectedAccounts, setSelectedAccounts, accountFilter, setAccountFilter, isDark, ff, cs, card, cardShadow }: WizardProps) {
  const connectedAccounts = MOCK_ACCOUNTS.filter(a => a.connected);
  const filtered = connectedAccounts.filter(a => accountFilter === "all" || a.platform === accountFilter);

  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-4" style={{ fontFamily: ff }}>

      <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cs("text-white", "text-slate-800")}>اختر الحسابات للنشر</h2>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{selectedAccounts.length} مختار</span>
            {selectedAccounts.length > 0 && (
              <button onClick={() => setSelectedAccounts([])}
                className="text-xs text-red-400 hover:text-red-300">إلغاء الكل</button>
            )}
            <button onClick={() => setSelectedAccounts(connectedAccounts.map(a => a.id))}
              className="text-xs text-violet-500 hover:text-violet-400">اختيار الكل</button>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => setAccountFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-sm ${accountFilter === "all" ? "bg-violet-600 text-white" : cs("bg-slate-700 text-slate-300", "bg-slate-100 text-slate-700")}`}>
            الكل ({connectedAccounts.length})
          </button>
          {[...new Set(connectedAccounts.map(a => a.platform))].map(p => (
            <button key={p} onClick={() => setAccountFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 ${accountFilter === p ? "bg-violet-600 text-white" : cs("bg-slate-700 text-slate-300", "bg-slate-100 text-slate-700")}`}>
              {getPlatformIcon(p, 14)}
              <span>{PLATFORM_RULES[p].label}</span>
            </button>
          ))}
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((acc) => {
            const isSelected = selectedAccounts.includes(acc.id);
            return (
              <motion.div key={acc.id}
                onClick={() => setSelectedAccounts(prev => isSelected ? prev.filter(id => id !== acc.id) : [...prev, acc.id])}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3
                  ${isSelected ? `ring-2 ring-violet-500 ${cs("bg-violet-900/20", "bg-violet-50")}` : cs("bg-slate-700/30 hover:bg-slate-700/50", "bg-slate-50 hover:bg-slate-100")}`}
                whileHover={{ scale: 1.01 }}>
                <div className="relative shrink-0">
                  {getPlatformIcon(acc.platform, 32)}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm ${cs("text-white", "text-slate-800")}`}>{acc.name}</p>
                    {acc.verified && <Check className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                  <p className={`text-xs ${cs("text-slate-400", "text-slate-500")}`}>{acc.username}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${cs("text-slate-400", "text-slate-500")}`}>{acc.followers}</p>
                  <p className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>متابع</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!connectedAccounts.some(a => accountFilter === "all" || a.platform === accountFilter) && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${cs("bg-amber-900/20 border border-amber-500/30", "bg-amber-50 border border-amber-200")}`}>
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className={`text-sm ${cs("text-amber-300", "text-amber-700")}`}>لا توجد حسابات متصلة لهذه المنصة</p>
        </div>
      )}
    </motion.div>
  );
}

// ==================== STEP 3: INSPECT & CUSTOMIZE ====================
function Step3InspectCustomize({ postContent, platformCustom, setPlatformCustom, selectedPlatforms, getValidationIssues, inspectTab, setInspectTab, isDark, ff, cs, card, cardShadow }: WizardProps) {
  const activeTab = inspectTab || selectedPlatforms[0] || "";

  useEffect(() => {
    if (!inspectTab && selectedPlatforms.length > 0) setInspectTab(selectedPlatforms[0]);
  }, [selectedPlatforms, inspectTab]);

  const totalErrors = selectedPlatforms.reduce((acc, p) => acc + getValidationIssues(p, postContent).filter(i => i.level === "error").length, 0);
  const totalWarnings = selectedPlatforms.reduce((acc, p) => acc + getValidationIssues(p, postContent).filter(i => i.level === "warning").length, 0);

  return (
    <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-4" style={{ fontFamily: ff }}>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "منصة", value: selectedPlatforms.length, color: "violet", icon: Globe },
          { label: "تنبيه", value: totalErrors, color: "red", icon: AlertCircle },
          { label: "تحذير", value: totalWarnings, color: "amber", icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className={`p-3 rounded-xl flex items-center gap-2 ${cs("bg-slate-800/60 border border-slate-700/60", "bg-white/90 border border-slate-200/70")}`}>
            <div className={`w-8 h-8 rounded-lg bg-${s.color}-500/10 flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 text-${s.color}-500`} />
            </div>
            <div>
              <p className={`text-lg leading-tight ${cs("text-white", "text-slate-800")}`}>{s.value}</p>
              <p className={`text-xs ${cs("text-slate-400", "text-slate-500")}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPlatforms.length === 0 ? (
        <div className={`p-6 rounded-2xl text-center ${cs("bg-slate-800/60 border border-slate-700/60", "bg-white/90 border border-slate-200")}`}>
          <Users className={`w-12 h-12 mx-auto mb-3 ${cs("text-slate-600", "text-slate-300")}`} />
          <p className={cs("text-slate-400", "text-slate-500")}>لم تختر أي حسابات بعد</p>
        </div>
      ) : (
        <div className={`${card}`} style={{ boxShadow: cardShadow }}>
          {/* Platform Tabs */}
          <div className={`flex gap-1 p-2 border-b ${cs("border-slate-700", "border-slate-200")} overflow-x-auto`}>
            {selectedPlatforms.map(p => {
              const issues = getValidationIssues(p, postContent);
              const errors = issues.filter(i => i.level === "error").length;
              const warnings = issues.filter(i => i.level === "warning").length;
              return (
                <button key={p} onClick={() => setInspectTab(p)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all shrink-0
                    ${activeTab === p ? cs("bg-slate-700 text-white", "bg-slate-100 text-slate-800") : cs("text-slate-400 hover:bg-slate-700/50", "text-slate-500 hover:bg-slate-50")}`}>
                  {getPlatformIcon(p, 16)}
                  <span className="hidden sm:inline">{PLATFORM_RULES[p].label}</span>
                  {errors > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{errors}</span>}
                  {errors === 0 && warnings > 0 && <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">{warnings}</span>}
                  {errors === 0 && warnings === 0 && issues.length < 3 && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Platform Panel */}
          {activeTab && (
            <div className="p-4 space-y-4">
              {/* Validation Issues */}
              {(() => {
                const issues = getValidationIssues(activeTab as PlatformType, postContent);
                return (
                  <div className="space-y-2">
                    <p className={`text-sm ${cs("text-slate-400", "text-slate-600")}`}>فحص المحتوى لـ {PLATFORM_RULES[activeTab as PlatformType]?.label}:</p>
                    {issues.length === 0 ? (
                      <div className={`flex items-center gap-2 p-3 rounded-xl ${cs("bg-emerald-900/20 border border-emerald-500/30", "bg-emerald-50 border border-emerald-200")}`}>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className={`text-sm ${cs("text-emerald-300", "text-emerald-700")}`}>المحتوى مثالي لهذه المنصة!</span>
                      </div>
                    ) : (
                      issues.map((issue, i) => (
                        <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-sm
                          ${issue.level === "error" ? cs("bg-red-900/20 border border-red-500/30 text-red-300", "bg-red-50 border border-red-200 text-red-700")
                            : issue.level === "warning" ? cs("bg-amber-900/20 border border-amber-500/30 text-amber-300", "bg-amber-50 border border-amber-200 text-amber-700")
                            : cs("bg-blue-900/20 border border-blue-500/30 text-blue-300", "bg-blue-50 border border-blue-200 text-blue-700")}`}>
                          {issue.level === "error" ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            : issue.level === "warning" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                          <span>{issue.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}

              {/* Platform Rules Info */}
              {(() => {
                const rule = PLATFORM_RULES[activeTab as PlatformType];
                return (
                  <div className={`p-3 rounded-xl ${cs("bg-slate-700/30", "bg-slate-50")}`}>
                    <p className={`text-xs mb-2 ${cs("text-slate-400", "text-slate-500")}`}>حدود المنصة:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-lg ${cs("bg-slate-800 text-slate-300", "bg-white text-slate-600 border border-slate-200")}`}>
                        {rule.maxChars.toLocaleString()} حرف كحد أقصى
                      </span>
                      {rule.maxImages && <span className={`text-xs px-2 py-1 rounded-lg ${cs("bg-slate-800 text-slate-300", "bg-white text-slate-600 border border-slate-200")}`}>{rule.maxImages} صور</span>}
                      {rule.maxHashtags && <span className={`text-xs px-2 py-1 rounded-lg ${cs("bg-slate-800 text-slate-300", "bg-white text-slate-600 border border-slate-200")}`}>{rule.maxHashtags} هاشتاغ</span>}
                      {rule.videoOnly && <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400">فيديو مطلوب</span>}
                    </div>
                  </div>
                );
              })()}

              {/* Custom Content */}
              <div>
                <label className={`block text-sm mb-2 ${cs("text-slate-400", "text-slate-600")}`}>
                  تخصيص المحتوى لـ {PLATFORM_RULES[activeTab as PlatformType]?.label}
                  <span className={`mr-2 text-xs ${cs("text-slate-500", "text-slate-400")}`}>(اختياري)</span>
                </label>
                <textarea
                  value={platformCustom[activeTab] || ""}
                  onChange={e => setPlatformCustom(prev => ({ ...prev, [activeTab]: e.target.value }))}
                  placeholder={`اترك فارغاً لاستخدام المحتوى الأساسي، أو اكتب محتوى مخصصاً لـ ${PLATFORM_RULES[activeTab as PlatformType]?.label}...`}
                  rows={4}
                  className={`w-full p-3 rounded-xl outline-none resize-none text-sm
                    ${cs("bg-slate-700/50 text-white placeholder-slate-500 border border-slate-600 focus:border-violet-500",
                      "bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-violet-400")}`}
                  style={{ fontFamily: ff }}
                />
                {platformCustom[activeTab] && (
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setPlatformCustom(prev => { const n = { ...prev }; delete n[activeTab]; return n; })}
                      className="text-xs text-red-400 hover:text-red-300">
                      حذف التخصيص والعودة للمحتوى الأساسي
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ==================== STEP 4: PREVIEW ====================
function Step4Preview({ postContent, postTitle, mediaFiles, platformCustom, selectedAccounts, selectedPlatforms, previewPlatform, setPreviewPlatform, isDark, ff, cs, card, cardShadow }: WizardProps) {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");
  const activePreview = previewPlatform || selectedPlatforms[0] || null;

  useEffect(() => {
    if (!previewPlatform && selectedPlatforms.length > 0) setPreviewPlatform(selectedPlatforms[0]);
  }, [selectedPlatforms, previewPlatform]);

  const getContent = (p: PlatformType) => platformCustom[p] || postContent;
  const getAccount = (p: PlatformType) => MOCK_ACCOUNTS.find(a => selectedAccounts.includes(a.id) && a.platform === p);

  return (
    <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-4" style={{ fontFamily: ff }}>

      {selectedPlatforms.length === 0 ? (
        <div className={`p-8 rounded-2xl text-center ${card}`}>
          <Eye className={`w-12 h-12 mx-auto mb-3 ${cs("text-slate-600", "text-slate-300")}`} />
          <p className={cs("text-slate-400", "text-slate-500")}>لم تختر أي حسابات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Platform Selector */}
          <div className={`p-4 ${card} lg:col-span-1`} style={{ boxShadow: cardShadow }}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm ${cs("text-slate-400", "text-slate-600")}`}>اختر المنصة</p>
              <div className="flex gap-1">
                {[{ v: "mobile", Icon: Smartphone }, { v: "desktop", Icon: Monitor }].map(({ v, Icon }) => (
                  <button key={v} onClick={() => setDeviceMode(v as "mobile" | "desktop")}
                    className={`p-1.5 rounded-lg ${deviceMode === v ? "bg-violet-600 text-white" : cs("text-slate-400 hover:bg-slate-700", "text-slate-500 hover:bg-slate-100")}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {selectedPlatforms.map(p => {
                const acc = getAccount(p);
                return (
                  <button key={p} onClick={() => setPreviewPlatform(p)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all
                      ${activePreview === p ? cs("bg-slate-700 ring-1 ring-violet-500", "bg-violet-50 ring-1 ring-violet-300") : cs("hover:bg-slate-700/50", "hover:bg-slate-50")}`}>
                    {getPlatformIcon(p, 24)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${cs("text-white", "text-slate-800")}`}>{PLATFORM_RULES[p].label}</p>
                      {acc && <p className={`text-xs truncate ${cs("text-slate-400", "text-slate-500")}`}>{acc.username}</p>}
                    </div>
                    {activePreview === p && <ChevronLeft className="w-4 h-4 text-violet-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            {activePreview && (
              <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
                <div className="flex items-center gap-2 mb-4">
                  {getPlatformIcon(activePreview, 20)}
                  <span className={cs("text-white", "text-slate-800")}>{PLATFORM_RULES[activePreview].label} — معاينة</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cs("bg-slate-700 text-slate-400", "bg-slate-100 text-slate-500")}`}>
                    {deviceMode === "mobile" ? "موبايل" : "ديسكتوب"}
                  </span>
                </div>
                <div className={`flex justify-center ${deviceMode === "mobile" ? "" : ""}`}>
                  <div className={`${deviceMode === "mobile" ? "max-w-[360px] w-full" : "w-full"}`}>
                    <PlatformPreview
                      platform={activePreview}
                      content={getContent(activePreview)}
                      title={postTitle}
                      media={mediaFiles}
                      account={getAccount(activePreview)}
                      isDark={isDark}
                      deviceMode={deviceMode}
                      ff={ff}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==================== PLATFORM PREVIEW MOCKUPS ====================
function PlatformPreview({ platform, content, title, media, account, isDark, deviceMode, ff }: {
  platform: PlatformType; content: string; title: string;
  media: MediaFile[]; account?: AccountEntry; isDark: boolean; deviceMode: string; ff: string;
}) {
  const hasImage = media.some(m => m.type === "image");
  const firstImage = media.find(m => m.type === "image");
  const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + "..." : s;
  const displayName = account?.name || "SocialHub";
  const displayUser = account?.username || "@socialhub";
  const preview = (
    <div className="rounded-xl overflow-hidden" style={{ fontFamily: ff }}>
      {platform === "instagram" && (
        <div className="bg-white text-black rounded-xl overflow-hidden border border-gray-200" style={{ maxWidth: 400 }}>
          <div className="flex items-center gap-2 p-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs">S</div>
            <div className="flex-1"><p className="text-xs font-semibold">{displayName}</p><p className="text-xs text-gray-400">الآن</p></div>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </div>
          {hasImage && firstImage ? (
            <img src={firstImage.preview} alt="" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
              <ImagePlus className="w-12 h-12 text-pink-200" />
            </div>
          )}
          <div className="p-3">
            <div className="flex items-center gap-4 mb-2">
              <Heart className="w-5 h-5" /><MessageCircle className="w-5 h-5" /><Share2 className="w-5 h-5" />
              <Bookmark className="w-5 h-5 mr-auto" />
            </div>
            <p className="text-xs font-semibold mb-1">١٢٤ إعجاب</p>
            <p className="text-xs"><span className="font-semibold">{displayUser} </span>{truncate(content || "محتوى المنشور", 120)}</p>
          </div>
        </div>
      )}
      {platform === "twitter" && (
        <div className={`rounded-xl p-4 border ${isDark ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-black"}`} style={{ maxWidth: 400 }}>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white shrink-0">S</div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-bold">{displayName}</span>
                <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>{displayUser} · الآن</span>
              </div>
              <p className="text-sm">{truncate(content || "محتوى التغريدة", 280)}</p>
              {hasImage && firstImage && <img src={firstImage.preview} alt="" className="mt-2 rounded-xl w-full max-h-48 object-cover" />}
              <div className={`flex items-center gap-6 mt-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 24</span>
                <span className="flex items-center gap-1"><Share2 className="w-4 h-4" /> 18</span>
                <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> 142</span>
                <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> 3.2K</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {platform === "facebook" && (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-black" style={{ maxWidth: 400 }}>
          <div className="flex items-center gap-2 p-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">S</div>
            <div><p className="text-sm font-semibold">{displayName}</p><p className="text-xs text-gray-400">الآن · 🌐</p></div>
            <MoreHorizontal className="w-4 h-4 text-gray-400 mr-auto" />
          </div>
          <p className="px-3 pb-3 text-sm">{truncate(content || "محتوى المنشور", 200)}</p>
          {hasImage && firstImage ? (
            <img src={firstImage.preview} alt="" className="w-full max-h-64 object-cover" />
          ) : null}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
              <span>👍 ❤️ 😮</span><span>124</span><span className="mr-auto">32 تعليق · 15 مشاركة</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {[{ icon: ThumbsUp, label: "إعجاب" }, { icon: MessageCircle, label: "تعليق" }, { icon: Share2, label: "مشاركة" }].map(({ icon: Icon, label }) => (
                <button key={label} className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-500 hover:bg-gray-50 py-1 rounded">
                  <Icon className="w-4 h-4" /><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {platform === "linkedin" && (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-black" style={{ maxWidth: 400 }}>
          <div className="flex items-start gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white shrink-0">S</div>
            <div>
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-gray-500">CEO · 1st</p>
              <p className="text-xs text-gray-400">الآن · 🌐</p>
            </div>
          </div>
          <p className="px-3 pb-3 text-sm">{truncate(content || "محتوى المنشور", 300)}</p>
          {hasImage && firstImage && <img src={firstImage.preview} alt="" className="w-full max-h-64 object-cover" />}
          <div className="p-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
            <span>👍 52 · 18 تعليق</span>
          </div>
          <div className="grid grid-cols-4 border-t border-gray-100 text-xs text-gray-500">
            {[{ icon: ThumbsUp, label: "إعجاب" }, { icon: MessageCircle, label: "تعليق" }, { icon: Share2, label: "مشاركة" }, { icon: Send, label: "إرسال" }].map(({ icon: Icon, label }) => (
              <button key={label} className="flex flex-col items-center py-2 gap-1 hover:bg-gray-50">
                <Icon className="w-4 h-4" /><span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {platform === "tiktok" && (
        <div className="bg-black rounded-xl overflow-hidden text-white" style={{ maxWidth: 260, margin: "0 auto" }}>
          <div className="relative aspect-[9/16] bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
            <Play className="w-16 h-16 text-white/40" />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold">@{displayUser}</p>
                  <p className="text-xs text-gray-300 mt-1">{truncate(content || "محتوى الفيديو", 100)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs">♫ صوت أصلي</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 text-xs">
                  <div className="flex flex-col items-center"><Heart className="w-6 h-6" /><span>12.5K</span></div>
                  <div className="flex flex-col items-center"><MessageCircle className="w-6 h-6" /><span>824</span></div>
                  <div className="flex flex-col items-center"><Share2 className="w-6 h-6" /><span>1.2K</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {platform === "youtube" && (
        <div className={`rounded-xl overflow-hidden ${isDark ? "bg-gray-900 text-white" : "bg-white text-black"} border ${isDark ? "border-gray-700" : "border-gray-200"}`} style={{ maxWidth: 400 }}>
          <div className="relative aspect-video bg-gray-800 flex items-center justify-center">
            {hasImage && firstImage ? <img src={firstImage.preview} alt="" className="w-full h-full object-cover" /> : <Play className="w-16 h-16 text-white/40" />}
            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">12:34</div>
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold mb-1">{title || "عنوان الفيديو"}</p>
            <div className={`flex items-center gap-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <span>{displayName}</span><span>·</span><span>1.2K مشاهدة</span><span>·</span><span>الآن</span>
            </div>
          </div>
        </div>
      )}
      {platform === "telegram" && (
        <div className="bg-[#17212b] rounded-xl overflow-hidden text-white p-4" style={{ maxWidth: 380 }}>
          <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-white/10`}>
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs">S</div>
            <div><p className="text-sm font-semibold">{displayName}</p><p className="text-xs text-gray-400">قناة عامة</p></div>
          </div>
          <div className="space-y-2">
            <div className="bg-[#1e2c3a] rounded-xl p-3 inline-block max-w-full">
              <p className="text-sm text-gray-200">{truncate(content || "محتوى الرسالة", 200)}</p>
              {hasImage && firstImage && <img src={firstImage.preview} alt="" className="mt-2 rounded-lg max-w-full max-h-40 object-cover" />}
              <p className="text-xs text-gray-500 text-left mt-1">الآن ✓✓</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Eye className="w-3 h-3" /><span>1.2K مشاهدة</span>
            </div>
          </div>
        </div>
      )}
      {platform === "whatsapp" && (
        <div className="bg-[#0b141a] rounded-xl overflow-hidden text-white" style={{ maxWidth: 360 }}>
          <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">S</div>
            <div><p className="text-sm">{displayName}</p><p className="text-xs text-gray-400">WhatsApp Business</p></div>
          </div>
          <div className="p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')]" style={{ minHeight: 150 }}>
            <div className="max-w-[80%] bg-[#005c4b] rounded-xl rounded-tr-none p-3 mr-auto">
              <p className="text-sm text-gray-100">{truncate(content || "رسالة WhatsApp", 200)}</p>
              {hasImage && firstImage && <img src={firstImage.preview} alt="" className="mt-2 rounded-lg w-full max-h-40 object-cover" />}
              <p className="text-xs text-gray-400 text-left mt-1">الآن ✓✓</p>
            </div>
          </div>
        </div>
      )}
      {platform === "threads" && (
        <div className={`rounded-xl p-4 border ${isDark ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-black"}`} style={{ maxWidth: 380 }}>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white shrink-0">S</div>
              <div className={`flex-1 w-0.5 mt-1 ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{displayUser}</span>
                <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>الآن</span>
              </div>
              <p className="text-sm">{truncate(content || "محتوى الخيط", 500)}</p>
              {hasImage && firstImage && <img src={firstImage.preview} alt="" className="mt-2 rounded-xl w-full max-h-48 object-cover" />}
              <div className={`flex items-center gap-4 mt-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                <Heart className="w-5 h-5" /><MessageCircle className="w-5 h-5" /><Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}
      {platform === "pinterest" && (
        <div className="bg-white rounded-xl overflow-hidden text-black border border-gray-200" style={{ maxWidth: 280 }}>
          <div className="relative">
            {hasImage && firstImage ? (
              <img src={firstImage.preview} alt="" className="w-full object-cover rounded-t-xl" style={{ maxHeight: 320 }} />
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <ImagePlus className="w-12 h-12 text-red-200" />
              </div>
            )}
            <button className="absolute top-2 left-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-full">حفظ</button>
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold">{title || "عنوان الدبوس"}</p>
            <p className="text-xs text-gray-500 mt-1">{truncate(content || "وصف الدبوس", 100)}</p>
          </div>
        </div>
      )}
      {platform === "snapchat" && (
        <div className="bg-black rounded-xl overflow-hidden text-white" style={{ maxWidth: 240, margin: "0 auto" }}>
          <div className="relative aspect-[9/16] bg-gradient-to-b from-yellow-400 to-yellow-500 flex items-center justify-center">
            <p className="text-black text-lg font-bold px-4 text-center">{truncate(content || "محتوى السناب", 100)}</p>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">S</div>
                <span className="text-sm">{displayUser}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {platform === "google_business" && (
        <div className={`rounded-xl overflow-hidden border ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-black"}`} style={{ maxWidth: 400 }}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Google Business · الآن</p>
              </div>
            </div>
            {hasImage && firstImage && <img src={firstImage.preview} alt="" className="w-full max-h-48 object-cover rounded-xl mb-3" />}
            <p className="text-sm">{truncate(content || "منشور Google Business", 300)}</p>
            <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">اعرف المزيد</button>
          </div>
        </div>
      )}
    </div>
  );
  return preview;
}

// ==================== STEP 5: PUBLISH ====================
function Step5Publish({ publishMode, setPublishMode, scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, selectedAccounts, selectedPlatforms, postContent, mediaFiles, isDark, ff, cs, card, cardShadow }: WizardProps) {
  const BEST_TIMES = [
    { platform: "instagram", time: "الثلاثاء والخميس 9ص - 11ص" },
    { platform: "twitter", time: "الإثنين والأربعاء 12ظ - 3م" },
    { platform: "facebook", time: "الأربعاء والجمعة 1م - 4م" },
    { platform: "linkedin", time: "الثلاثاء والأربعاء 10ص - 12ظ" },
  ];

  return (
    <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-4" style={{ fontFamily: ff }}>

      {/* Summary Card */}
      <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
        <p className={`text-sm mb-3 ${cs("text-slate-400", "text-slate-600")}`}>ملخص المنشور:</p>
        <div className={`p-3 rounded-xl ${cs("bg-slate-700/30", "bg-slate-50")} space-y-2 text-sm`}>
          <div className="flex items-center gap-2">
            <FileText className={`w-4 h-4 ${cs("text-slate-400", "text-slate-500")}`} />
            <span className={cs("text-slate-300", "text-slate-600")}>{postContent.length} حرف</span>
          </div>
          <div className="flex items-center gap-2">
            <Image className={`w-4 h-4 ${cs("text-slate-400", "text-slate-500")}`} />
            <span className={cs("text-slate-300", "text-slate-600")}>{mediaFiles.length} وسائط</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className={`w-4 h-4 ${cs("text-slate-400", "text-slate-500")}`} />
            <span className={cs("text-slate-300", "text-slate-600")}>{selectedAccounts.length} حساب</span>
            <div className="flex gap-1">
              {selectedPlatforms.map(p => <span key={p}>{getPlatformIcon(p, 14)}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          onClick={() => setPublishMode("now")}
          className={`p-5 rounded-2xl cursor-pointer transition-all ${publishMode === "now" ? `ring-2 ring-violet-500 ${cs("bg-violet-900/20", "bg-violet-50")}` : card}`}
          style={publishMode !== "now" ? { boxShadow: cardShadow } : {}}
          whileHover={{ scale: 1.02 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${publishMode === "now" ? "bg-violet-600" : cs("bg-slate-700", "bg-slate-100")}`}>
              <Zap className={`w-6 h-6 ${publishMode === "now" ? "text-white" : cs("text-slate-400", "text-slate-500")}`} />
            </div>
            <div>
              <p className={cs("text-white", "text-slate-800")}>نشر فوري</p>
              <p className={`text-xs ${cs("text-slate-400", "text-slate-500")}`}>انشر الآن على الفور</p>
            </div>
          </div>
          {publishMode === "now" && (
            <div className="flex items-center gap-2 text-violet-500 text-sm">
              <Check className="w-4 h-4" /><span>محدد</span>
            </div>
          )}
        </motion.div>

        <motion.div
          onClick={() => setPublishMode("schedule")}
          className={`p-5 rounded-2xl cursor-pointer transition-all ${publishMode === "schedule" ? `ring-2 ring-blue-500 ${cs("bg-blue-900/20", "bg-blue-50")}` : card}`}
          style={publishMode !== "schedule" ? { boxShadow: cardShadow } : {}}
          whileHover={{ scale: 1.02 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${publishMode === "schedule" ? "bg-blue-600" : cs("bg-slate-700", "bg-slate-100")}`}>
              <Calendar className={`w-6 h-6 ${publishMode === "schedule" ? "text-white" : cs("text-slate-400", "text-slate-500")}`} />
            </div>
            <div>
              <p className={cs("text-white", "text-slate-800")}>جدولة</p>
              <p className={`text-xs ${cs("text-slate-400", "text-slate-500")}`}>اختر وقتاً للنشر</p>
            </div>
          </div>
          {publishMode === "schedule" && (
            <div className="space-y-2 mt-2">
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${cs("bg-slate-800 text-white border-slate-600 focus:border-blue-500", "bg-white text-slate-800 border-slate-200 focus:border-blue-400")}`} />
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${cs("bg-slate-800 text-white border-slate-600 focus:border-blue-500", "bg-white text-slate-800 border-slate-200 focus:border-blue-400")}`} />
            </div>
          )}
        </motion.div>
      </div>

      {/* Best Times */}
      <div className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <p className={`text-sm ${cs("text-slate-300", "text-slate-700")}`}>أفضل أوقات النشر</p>
        </div>
        <div className="space-y-2">
          {BEST_TIMES.filter(t => selectedPlatforms.includes(t.platform as PlatformType)).map((t, i) => (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${cs("bg-slate-700/30", "bg-slate-50")}`}>
              {getPlatformIcon(t.platform as PlatformType, 18)}
              <span className={`text-sm ${cs("text-slate-300", "text-slate-600")}`}>{PLATFORM_RULES[t.platform as PlatformType].label}:</span>
              <span className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{t.time}</span>
              {publishMode === "schedule" && (
                <button onClick={() => {
                  const today = new Date();
                  const next = new Date(today.setDate(today.getDate() + 2));
                  setScheduleDate(next.toISOString().split("T")[0]);
                  setScheduleTime("10:00");
                }} className="mr-auto text-xs text-blue-500 hover:text-blue-400">استخدام</button>
              )}
            </div>
          ))}
          {selectedPlatforms.length === 0 && (
            <p className={`text-sm text-center py-2 ${cs("text-slate-500", "text-slate-400")}`}>اختر منصات لعرض أفضل الأوقات</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== TEMPLATES VIEW ====================
interface TemplatesViewProps {
  templates: PostTemplate[]; setTemplates: (v: PostTemplate[] | ((p: PostTemplate[]) => PostTemplate[])) => void;
  isDark: boolean; ff: string; cs: (d: string, l: string) => string; card: string; cardShadow: string;
  onBack: () => void; onUse: (t: PostTemplate) => void;
  search: string; setSearch: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  editingTemplate: PostTemplate | null; setEditingTemplate: (v: PostTemplate | null) => void;
  showModal: boolean; setShowModal: (v: boolean) => void;
  templateForm: { name: string; category: string; emoji: string; content: string; platforms: PlatformType[] };
  setTemplateForm: (v: any) => void;
}

function TemplatesView({ templates, setTemplates, isDark, ff, cs, card, cardShadow, onBack, onUse, search, setSearch, category, setCategory, editingTemplate, setEditingTemplate, showModal, setShowModal, templateForm, setTemplateForm }: TemplatesViewProps) {
  const categories = ["الكل", ...Array.from(new Set(templates.map(t => t.category)))];
  const filtered = templates.filter(t =>
    (category === "الكل" || t.category === category) &&
    (search === "" || t.name.includes(search) || t.content.includes(search))
  );

  const openNew = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", category: "عام", emoji: "✨", content: "", platforms: [] });
    setShowModal(true);
  };

  const openEdit = (t: PostTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, category: t.category, emoji: t.emoji, content: t.content, platforms: t.platforms });
    setShowModal(true);
  };

  const saveTemplate = () => {
    if (!templateForm.name || !templateForm.content) { toast.error("الاسم والمحتوى مطلوبان"); return; }
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...templateForm } : t));
      toast.success("تم تحديث القالب");
    } else {
      const newT: PostTemplate = { id: `t${Date.now()}`, ...templateForm, createdAt: new Date().toISOString().split("T")[0], usageCount: 0 };
      setTemplates(prev => [...prev, newT]);
      toast.success("تم إضافة القالب");
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-5" style={{ fontFamily: ff }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className={`p-2 rounded-xl ${cs("bg-slate-800 text-white hover:bg-slate-700", "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200")}`}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl ${cs("text-white", "text-slate-800")}`}>القوالب</h1>
          <p className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{templates.length} قالب متاح</p>
        </div>
        <button onClick={openNew}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm flex items-center gap-2 hover:bg-violet-700">
          <Plus className="w-4 h-4" /><span>قالب جديد</span>
        </button>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className={`flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl ${cs("bg-slate-800 border border-slate-700", "bg-white border border-slate-200")}`}>
          <Search className={`w-4 h-4 ${cs("text-slate-400", "text-slate-400")}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في القوالب..."
            className={`flex-1 bg-transparent outline-none text-sm ${cs("text-white placeholder-slate-500", "text-slate-800 placeholder-slate-400")}`} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-xl text-sm ${category === cat ? "bg-violet-600 text-white" : cs("bg-slate-800 text-slate-300 hover:bg-slate-700", "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200")}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t, i) => (
          <motion.div key={t.id} className={`p-4 ${card} flex flex-col`} style={{ boxShadow: cardShadow }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cs("text-white", "text-slate-800")}>{t.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${cs("bg-slate-700 text-slate-400", "bg-slate-100 text-slate-500")}`}>{t.category}</span>
              </div>
            </div>
            <p className={`text-sm flex-1 line-clamp-3 mb-3 ${cs("text-slate-400", "text-slate-500")}`}>{t.content}</p>
            <div className="flex items-center gap-1 mb-3">
              {t.platforms.slice(0, 5).map(p => <span key={p}>{getPlatformIcon(p, 16)}</span>)}
              {t.platforms.length > 5 && <span className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>+{t.platforms.length - 5}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onUse(t)}
                className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700">
                استخدام
              </button>
              <button onClick={() => openEdit(t)}
                className={`p-2 rounded-xl ${cs("bg-slate-700 text-slate-300 hover:bg-slate-600", "bg-slate-100 text-slate-600 hover:bg-slate-200")}`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => { setTemplates(prev => prev.filter(x => x.id !== t.id)); toast.success("تم حذف القالب"); }}
                className={`p-2 rounded-xl ${cs("bg-slate-700 text-red-400 hover:bg-slate-600", "bg-slate-100 text-red-500 hover:bg-red-50")}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`p-10 text-center rounded-2xl ${card}`}>
          <LayoutTemplate className={`w-12 h-12 mx-auto mb-3 ${cs("text-slate-600", "text-slate-300")}`} />
          <p className={cs("text-slate-400", "text-slate-500")}>لا توجد قوالب مطابقة</p>
          <button onClick={openNew} className="mt-3 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm">
            إضافة قالب جديد
          </button>
        </div>
      )}

      {/* Template Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-lg rounded-2xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)", fontFamily: ff }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={cs("text-white", "text-slate-800")}>{editingTemplate ? "تعديل القالب" : "قالب جديد"}</h3>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl ${cs("hover:bg-slate-700", "hover:bg-slate-100")}`}>
                  <X className={`w-4 h-4 ${cs("text-slate-400", "text-slate-500")}`} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input value={templateForm.emoji} onChange={e => setTemplateForm((p: typeof templateForm) => ({ ...p, emoji: e.target.value }))}
                    className={`w-16 text-center text-2xl px-2 py-2 rounded-xl border outline-none ${cs("bg-slate-700 border-slate-600 text-white", "bg-slate-50 border-slate-200 text-slate-800")}`} />
                  <input value={templateForm.name} onChange={e => setTemplateForm((p: typeof templateForm) => ({ ...p, name: e.target.value }))}
                    placeholder="اسم القالب" className={`flex-1 px-3 py-2 rounded-xl border outline-none ${cs("bg-slate-700 border-slate-600 text-white placeholder-slate-500", "bg-white border-slate-200 text-slate-800 placeholder-slate-400")}`} />
                </div>
                <input value={templateForm.category} onChange={e => setTemplateForm((p: typeof templateForm) => ({ ...p, category: e.target.value }))}
                  placeholder="الفئة (مثال: إعلان، تفاعلي، محتوى)" className={`w-full px-3 py-2 rounded-xl border outline-none ${cs("bg-slate-700 border-slate-600 text-white placeholder-slate-500", "bg-white border-slate-200 text-slate-800 placeholder-slate-400")}`} />
                <textarea value={templateForm.content} onChange={e => setTemplateForm((p: typeof templateForm) => ({ ...p, content: e.target.value }))}
                  placeholder="محتوى القالب..." rows={5}
                  className={`w-full px-3 py-2 rounded-xl border outline-none resize-none ${cs("bg-slate-700 border-slate-600 text-white placeholder-slate-500", "bg-white border-slate-200 text-slate-800 placeholder-slate-400")}`}
                  style={{ fontFamily: ff }} />
                <div>
                  <p className={`text-sm mb-2 ${cs("text-slate-400", "text-slate-600")}`}>المنصات المناسبة:</p>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map(p => (
                      <button key={p.id} onClick={() => setTemplateForm((prev: typeof templateForm) => ({
                        ...prev,
                        platforms: prev.platforms.includes(p.id) ? prev.platforms.filter((x: PlatformType) => x !== p.id) : [...prev.platforms, p.id]
                      }))}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm transition-all
                          ${templateForm.platforms.includes(p.id) ? "bg-violet-600 text-white" : cs("bg-slate-700 text-slate-300 hover:bg-slate-600", "bg-slate-100 text-slate-600 hover:bg-slate-200")}`}>
                        {getPlatformIcon(p.id, 14)}<span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveTemplate}
                  className="w-full py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700">
                  {editingTemplate ? "حفظ التعديلات" : "إضافة القالب"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== SCHEDULED VIEW ====================
function ScheduledView({ posts, setPosts, accounts, isDark, ff, cs, card, cardShadow, onBack }: {
  posts: ScheduledPost[]; setPosts: (v: ScheduledPost[] | ((p: ScheduledPost[]) => ScheduledPost[])) => void;
  accounts: AccountEntry[]; isDark: boolean; ff: string;
  cs: (d: string, l: string) => string; card: string; cardShadow: string; onBack: () => void;
}) {
  return (
    <div className="space-y-5" style={{ fontFamily: ff }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <button onClick={onBack} className={`p-2 rounded-xl ${cs("bg-slate-800 text-white hover:bg-slate-700", "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200")}`}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-xl sm:text-2xl ${cs("text-white", "text-slate-800")}`}>المنشورات المجدولة</h1>
          <p className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{posts.length} منشور مجدول</p>
        </div>
      </motion.div>

      {posts.length === 0 ? (
        <div className={`p-10 text-center ${card}`} style={{ boxShadow: cardShadow }}>
          <Calendar className={`w-12 h-12 mx-auto mb-3 ${cs("text-slate-600", "text-slate-300")}`} />
          <p className={cs("text-slate-400", "text-slate-500")}>لا توجد منشورات مجدولة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div key={post.id} className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center
                  ${post.status === "published" ? "bg-emerald-500/10" : post.status === "failed" ? "bg-red-500/10" : "bg-blue-500/10"}`}>
                  {post.status === "published" ? <Check className="w-5 h-5 text-emerald-500" />
                    : post.status === "failed" ? <X className="w-5 h-5 text-red-500" />
                    : <Clock className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm mb-1 ${cs("text-slate-300", "text-slate-700")}`}>{post.content.slice(0, 120)}...</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className={`w-3.5 h-3.5 ${cs("text-slate-500", "text-slate-400")}`} />
                      <span className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>{post.scheduledAt}</span>
                    </div>
                    {post.media > 0 && (
                      <div className="flex items-center gap-1">
                        <ImagePlus className={`w-3.5 h-3.5 ${cs("text-slate-500", "text-slate-400")}`} />
                        <span className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>{post.media}</span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {post.accounts.slice(0, 4).map(id => {
                        const acc = accounts.find(a => a.id === id);
                        return acc ? <span key={id}>{getPlatformIcon(acc.platform, 14)}</span> : null;
                      })}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${post.status === "published" ? "bg-emerald-500/10 text-emerald-500"
                        : post.status === "failed" ? "bg-red-500/10 text-red-500"
                        : "bg-blue-500/10 text-blue-500"}`}>
                      {post.status === "published" ? "منشور" : post.status === "failed" ? "فشل" : "مجدول"}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setPosts(prev => prev.filter(p => p.id !== post.id)); toast.success("تم حذف المنشور المجدول"); }}
                  className={`p-2 rounded-xl ${cs("hover:bg-slate-700 text-slate-500", "hover:bg-slate-100 text-slate-400")}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== DRAFTS VIEW ====================
function DraftsView({ drafts, setDrafts, accounts, isDark, ff, cs, card, cardShadow, onBack, onEdit }: {
  drafts: DraftPost[]; setDrafts: (v: DraftPost[] | ((p: DraftPost[]) => DraftPost[])) => void;
  accounts: AccountEntry[]; isDark: boolean; ff: string;
  cs: (d: string, l: string) => string; card: string; cardShadow: string;
  onBack: () => void; onEdit: (d: DraftPost) => void;
}) {
  return (
    <div className="space-y-5" style={{ fontFamily: ff }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <button onClick={onBack} className={`p-2 rounded-xl ${cs("bg-slate-800 text-white hover:bg-slate-700", "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200")}`}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-xl sm:text-2xl ${cs("text-white", "text-slate-800")}`}>المسودات</h1>
          <p className={`text-sm ${cs("text-slate-400", "text-slate-500")}`}>{drafts.length} مسودة محفوظة</p>
        </div>
      </motion.div>

      {drafts.length === 0 ? (
        <div className={`p-10 text-center ${card}`} style={{ boxShadow: cardShadow }}>
          <FolderOpen className={`w-12 h-12 mx-auto mb-3 ${cs("text-slate-600", "text-slate-300")}`} />
          <p className={cs("text-slate-400", "text-slate-500")}>لا توجد مسودات محفوظة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, i) => (
            <motion.div key={draft.id} className={`p-4 ${card}`} style={{ boxShadow: cardShadow }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0`}>
                  <FileText className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm mb-1 ${cs("text-slate-300", "text-slate-700")}`}>{draft.content.slice(0, 120)}...</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className={`w-3.5 h-3.5 ${cs("text-slate-500", "text-slate-400")}`} />
                      <span className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>{draft.savedAt}</span>
                    </div>
                    {draft.media > 0 && (
                      <div className="flex items-center gap-1">
                        <ImagePlus className={`w-3.5 h-3.5 ${cs("text-slate-500", "text-slate-400")}`} />
                        <span className={`text-xs ${cs("text-slate-500", "text-slate-400")}`}>{draft.media} وسائط</span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {draft.accounts.slice(0, 4).map(id => {
                        const acc = accounts.find(a => a.id === id);
                        return acc ? <span key={id}>{getPlatformIcon(acc.platform, 14)}</span> : null;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(draft)}
                    className={`p-2 rounded-xl ${cs("bg-slate-700 text-slate-300 hover:bg-slate-600", "bg-slate-100 text-slate-600 hover:bg-slate-200")}`}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setDrafts(prev => prev.filter(d => d.id !== draft.id)); toast.success("تم حذف المسودة"); }}
                    className={`p-2 rounded-xl ${cs("hover:bg-slate-700 text-red-400", "hover:bg-red-50 text-red-500")}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
