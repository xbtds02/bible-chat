// Bible Chat - Core Application Logic
// ======================================

// ====== Bible Data (Embedded - Chinese Union Version samples) ======
const BIBLE_DATA = {
  books: [
    { id: 'GEN', name: '创世记', testament: 'OT', chapters: 50 },
    { id: 'EXO', name: '出埃及记', testament: 'OT', chapters: 40 },
    { id: 'LEV', name: '利未记', testament: 'OT', chapters: 27 },
    { id: 'NUM', name: '民数记', testament: 'OT', chapters: 36 },
    { id: 'DEU', name: '申命记', testament: 'OT', chapters: 34 },
    { id: 'MAT', name: '马太福音', testament: 'NT', chapters: 28 },
    { id: 'MRK', name: '马可福音', testament: 'NT', chapters: 16 },
    { id: 'LUK', name: '路加福音', testament: 'NT', chapters: 24 },
    { id: 'JHN', name: '约翰福音', testament: 'NT', chapters: 21 },
    { id: 'ACT', name: '使徒行传', testament: 'NT', chapters: 28 },
    { id: 'ROM', name: '罗马书', testament: 'NT', chapters: 16 },
    { id: '1CO', name: '哥林多前书', testament: 'NT', chapters: 16 },
    { id: '2CO', name: '哥林多后书', testament: 'NT', chapters: 13 },
    { id: 'GAL', name: '加拉太书', testament: 'NT', chapters: 6 },
    { id: 'EPH', name: '以弗所书', testament: 'NT', chapters: 6 },
    { id: 'PHP', name: '腓立比书', testament: 'NT', chapters: 4 },
    { id: 'COL', name: '歌罗西书', testament: 'NT', chapters: 4 },
    { id: '1TH', name: '帖撒罗尼迦前书', testament: 'NT', chapters: 5 },
    { id: '2TH', name: '帖撒罗尼迦后书', testament: 'NT', chapters: 3 },
    { id: '1TI', name: '提摩太前书', testament: 'NT', chapters: 6 },
    { id: '2TI', name: '提摩太后书', testament: 'NT', chapters: 4 },
    { id: 'TIT', name: '提多书', testament: 'NT', chapters: 3 },
    { id: 'PHM', name: '腓利门书', testament: 'NT', chapters: 1 },
    { id: 'HEB', name: '希伯来书', testament: 'NT', chapters: 13 },
    { id: 'JAS', name: '雅各书', testament: 'NT', chapters: 5 },
    { id: '1PE', name: '彼得前书', testament: 'NT', chapters: 5 },
    { id: '2PE', name: '彼得后书', testament: 'NT', chapters: 3 },
    { id: '1JN', name: '约翰一书', testament: 'NT', chapters: 5 },
    { id: '2JN', name: '约翰二书', testament: 'NT', chapters: 1 },
    { id: '3JN', name: '约翰三书', testament: 'NT', chapters: 1 },
    { id: 'JUD', name: '犹大书', testament: 'NT', chapters: 1 },
    { id: 'REV', name: '启示录', testament: 'NT', chapters: 22 },
    { id: 'PSA', name: '诗篇', testament: 'OT', chapters: 150 },
    { id: 'PRO', name: '箴言', testament: 'OT', chapters: 31 },
    { id: 'ECC', name: '传道书', testament: 'OT', chapters: 12 },
    { id: 'SNG', name: '雅歌', testament: 'OT', chapters: 8 },
    { id: 'ISA', name: '以赛亚书', testament: 'OT', chapters: 66 },
    { id: 'JER', name: '耶利米书', testament: 'OT', chapters: 52 },
    { id: 'LAM', name: '耶利米哀歌', testament: 'OT', chapters: 5 },
    { id: 'EZK', name: '以西结书', testament: 'OT', chapters: 48 },
    { id: 'DAN', name: '但以理书', testament: 'OT', chapters: 12 },
    { id: 'HOS', name: '何西阿书', testament: 'OT', chapters: 14 },
    { id: 'JOE', name: '约珥书', testament: 'OT', chapters: 3 },
    { id: 'AMO', name: '阿摩司书', testament: 'OT', chapters: 9 },
    { id: 'OBA', name: '俄巴底亚书', testament: 'OT', chapters: 1 },
    { id: 'JON', name: '约拿书', testament: 'OT', chapters: 4 },
    { id: 'MIC', name: '弥迦书', testament: 'OT', chapters: 7 },
    { id: 'NAH', name: '那鸿书', testament: 'OT', chapters: 3 },
    { id: 'HAB', name: '哈巴谷书', testament: 'OT', chapters: 3 },
    { id: 'ZEP', name: '西番雅书', testament: 'OT', chapters: 3 },
    { id: 'HAG', name: '哈该书', testament: 'OT', chapters: 2 },
    { id: 'ZEC', name: '撒迦利亚书', testament: 'OT', chapters: 14 },
    { id: 'MAL', name: '玛拉基书', testament: 'OT', chapters: 4 },
  ],
  verses: [
    { ref: '约翰福音 3:16', text: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。', tags: ['爱','救恩','信心'] },
    { ref: '罗马书 8:28', text: '我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。', tags: ['苦难','应许','旨意'] },
    { ref: '诗篇 23:1', text: '耶和华是我的牧者，我必不至缺乏。', tags: ['供应','平安','信靠'] },
    { ref: '腓立比书 4:13', text: '我靠着那加给我力量的，凡事都能做。', tags: ['力量','信心','克服'] },
    { ref: '箴言 3:5-6', text: '你要专心仰赖耶和华，不可倚靠自己的聪明，在你一切所行的事上都要认定他，他必指引你的路。', tags: ['信靠','引导','智慧'] },
    { ref: '马太福音 11:28', text: '凡劳苦担重担的人可以到我这里来，我就使你们得安息。', tags: ['安息','安慰','邀请'] },
    { ref: '以赛亚书 40:31', text: '但那等候耶和华的必重新得力。他们必如鹰展翅上腾；他们奔跑却不困倦，行走却不疲乏。', tags: ['等候','力量','更新'] },
    { ref: '耶利米书 29:11', text: '耶和华说：我知道我向你们所怀的意念是赐平安的意念，不是降灾祸的意念，要叫你们末后有指望。', tags: ['盼望','平安','计划'] },
    { ref: '约翰一书 4:18', text: '爱里没有惧怕；爱既完全，就把惧怕除去。因为惧怕里含着刑罚，惧怕的人在爱里未得完全。', tags: ['爱','惧怕','完全'] },
    { ref: '哥林多前书 13:4-8', text: '爱是恒久忍耐，又有恩慈；爱是不嫉妒；爱是不自夸，不张狂，不做害羞的事，不求自己的益处，不轻易发怒，不计算人的恶，不喜欢不义，只喜欢真理；凡事包容，凡事相信，凡事盼望，凡事忍耐。爱是永不止息。', tags: ['爱','忍耐','恩慈'] },
    { ref: '以弗所书 2:8-9', text: '你们得救是本乎恩，也因着信；这并不是出于自己，乃是神所赐的；也不是出于行为，免得有人自夸。', tags: ['救恩','恩典','信心'] },
    { ref: '加拉太书 5:22-23', text: '圣灵所结的果子，就是仁爱、喜乐、和平、忍耐、恩慈、良善、信实、温柔、节制。这样的事没有律法禁止。', tags: ['圣灵','果子','品格'] },
    { ref: '帖撒罗尼迦前书 5:16-18', text: '要常常喜乐，不住地祷告，凡事谢恩；因为这是神在基督耶稣里向你们所定的旨意。', tags: ['喜乐','祷告','感恩'] },
    { ref: '希伯来书 11:1', text: '信是所望之事的实底，是未见之事的确据。', tags: ['信心','盼望','确据'] },
    { ref: '雅各书 1:2-3', text: '我的弟兄们，你们落在百般试炼中，都要以为大喜乐；因为知道你们的信心经过试验，就生忍耐。', tags: ['试炼','忍耐','信心'] },
    { ref: '彼得前书 5:7', text: '你们要将一切的忧虑卸给神，因为他顾念你们。', tags: ['忧虑','交托','顾念'] },
    { ref: '诗篇 46:1', text: '神是我们的避难所，是我们的力量，是我们在患难中随时的帮助。', tags: ['避难所','力量','帮助'] },
    { ref: '诗篇 119:105', text: '你的话是我脚前的灯，是我路上的光。', tags: ['话语','引导','亮光'] },
    { ref: '哥林多后书 5:17', text: '若有人在基督里，他就是新造的人，旧事已过，都变成新的了。', tags: ['更新','基督','新造'] },
    { ref: '箴言 22:6', text: '教养孩童，使他走当行的道，就是到老他也不偏离。', tags: ['教育','子女','引导'] },
    { ref: '马太福音 6:33', text: '你们要先求他的国和他的义，这些东西都要加给你们了。', tags: ['优先','国度','供应'] },
    { ref: '约翰福音 14:6', text: '耶稣说：我就是道路、真理、生命；若不藉着我，没有人能到父那里去。', tags: ['耶稣','道路','真理'] },
    { ref: '以弗所书 6:10-11', text: '我还有末了的话：你们要靠着主，倚赖他的大能大力做刚强的人。要穿戴神所赐的全副军装，就能抵挡魔鬼的诡计。', tags: ['属灵争战','军装','刚强'] },
    { ref: '诗篇 121:1-2', text: '我要向山举目；我的帮助从何而来？我的帮助从造天地的耶和华而来。', tags: ['帮助','仰望','信靠'] },
    { ref: '罗马书 12:2', text: '不要效法这个世界，只要心意更新而变化，叫你们察验何为神的善良、纯全、可喜悦的旨意。', tags: ['更新','心意','旨意'] },
    { ref: '约翰一书 1:9', text: '我们若认自己的罪，神是信实的，是公义的，必要赦免我们的罪，洗净我们一切的不义。', tags: ['认罪','赦免','洁净'] },
    { ref: '诗篇 139:14', text: '我要称谢你，因我受造奇妙可畏；你的作为奇妙，这是我心深知道的。', tags: ['受造','奇妙','感恩'] },
    { ref: '马可福音 9:23', text: '耶稣对他说：你若能信，在信的人，凡事都能。', tags: ['信心','能力','相信'] },
    { ref: '路加福音 6:31', text: '你们愿意人怎样待你们，你们也要怎样待人。', tags: ['待人','黄金法则'] },
    { ref: '箴言 16:3', text: '你所做的，要交托耶和华，你所谋的，就必成立。', tags: ['交托','计划','成就'] },
    { ref: '以赛亚书 41:10', text: '你不要害怕，因为我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你；我必用我公义的右手扶持你。', tags: ['同在','坚固','扶持'] },
    { ref: '罗马书 5:8', text: '惟有基督在我们还作罪人的时候为我们死，神的爱就在此向我们显明了。', tags: ['爱','牺牲','恩典'] },
    { ref: '哥林多前书 10:13', text: '你们所遇见的试探，无非是人所能受的。神是信实的，必不叫你们受试探过于所能受的；在受试探的时候，总要给你们开一条出路，叫你们能忍受得住。', tags: ['试探','信实','出路'] },
    { ref: '诗篇 37:4', text: '又要以耶和华为乐，他就将你心里所求的赐给你。', tags: ['喜乐','祈求','赐福'] },
    { ref: '马太福音 5:16', text: '你们的光也当这样照在人前，叫他们看见你们的好行为，便将荣耀归给你们在天上的父。', tags: ['光','好行为','荣耀'] },
    { ref: '提摩太后书 1:7', text: '因为神赐给我们，不是胆怯的心，乃是刚强、仁爱、谨守的心。', tags: ['刚强','仁爱','谨守'] },
    { ref: '希伯来书 13:5', text: '你们存心不可贪爱钱财，要以自己所有的为足；因为主曾说：我总不撇下你，也不丢弃你。', tags: ['知足','同在','信实'] },
    { ref: '诗篇 19:14', text: '耶和华我的磐石，我的救赎主啊，愿我口中的言语、心里的意念在你面前蒙悦纳。', tags: ['言语','意念','祷告'] },
    { ref: '约翰福音 10:10', text: '盗贼来，无非要偷窃，杀害，毁坏；我来了，是要叫羊得生命，并且得的更丰盛。', tags: ['丰盛','生命','平安'] },
    { ref: '以弗所书 3:20', text: '神能照着运行在我们心里的大力充充足足地成就一切，超过我们所求所想的。', tags: ['能力','成就','丰富'] },
    { ref: '箴言 3:5', text: '你要专心仰赖耶和华，不可倚靠自己的聪明。', tags: ['信靠','仰望'] },
    { ref: '诗篇 91:1', text: '住在至高者隐密处的，必住在全能者的荫下。', tags: ['隐密处','荫下','保护'] },
    { ref: '罗马书 15:13', text: '但愿使人有盼望的神，因信将诸般的喜乐、平安充满你们的心，使你们藉着圣灵的能力大有盼望。', tags: ['盼望','喜乐','平安'] },
    { ref: '马太福音 28:20', text: '我就常与你们同在，直到世界的末了。', tags: ['同在','应许','末了'] },
    { ref: '诗篇 103:1', text: '我的心哪，你要称颂耶和华！凡在我里面的，也要称颂他的圣名！', tags: ['称颂','感恩','赞美'] },
    { ref: '约翰福音 15:5', text: '我是葡萄树，你们是枝子。常在我里面的，我也常在他里面，这人就多结果子；因为离了我，你们就不能做什么。', tags: ['连接','结果子','依靠'] },
    { ref: '箴言 4:23', text: '你要保守你心，胜过保守一切，因为一生的果效是由心发出。', tags: ['心','保守','生命'] },
    { ref: '以赛亚书 26:3', text: '坚心倚赖你的，你必保守他十分平安，因为他倚靠你。', tags: ['平安','倚靠','保守'] },
    { ref: '路加福音 12:32', text: '你们这小群，不要惧怕，因为你们的父乐意把国赐给你们。', tags: ['惧怕','天国','赏赐'] },
    { ref: '诗篇 33:22', text: '耶和华啊，求你照我们所仰望你的，向我们施行慈爱！', tags: ['仰望','慈爱','祷告'] },
    { ref: '加拉太书 2:20', text: '我已经与基督同钉十字架，现在活着的不再是我，乃是基督在我里面活着。', tags: ['生命','基督','改变'] },
    { ref: '诗篇 55:22', text: '你要把你的重担卸给耶和华，他必抚养你；他永不叫义人动摇。', tags: ['重担','交托','抚养'] },
    { ref: '以弗所书 1:3', text: '愿颂赞归与我们主耶稣基督的父神！他在基督里曾赐给我们天上各样属灵的福气。', tags: ['祝福','属灵','感恩'] },
    { ref: '约翰一书 5:14-15', text: '我们若照他的旨意求什么，他就听我们，这是我们向他所存坦然无惧的心。既然知道他听我们一切所求的，就知道我们所求于他的，无不得着。', tags: ['祷告','旨意','确信'] },
    { ref: '诗篇 30:5', text: '因为，他的怒气不过是转眼之间；他的恩典乃是一生之久。一宿虽然有哭泣，早晨便必欢呼。', tags: ['恩典','安慰','盼望'] },
    { ref: '马太福音 7:7', text: '你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。', tags: ['祈求','寻找','应许'] },
    { ref: '歌罗西书 3:23', text: '无论做什么，都要从心里做，像是给主做的，不是给人做的。', tags: ['工作','尽心','服事'] },
    { ref: '箴言 18:10', text: '耶和华的名是坚固台；义人奔入便得安稳。', tags: ['名','坚固','安稳'] },
    { ref: '诗篇 121:3-4', text: '他必不叫你的脚摇动；保护你的必不打盹！保护以色列的，也不打盹也不睡觉。', tags: ['保护','不打盹','信靠'] },
    { ref: '腓立比书 4:6-7', text: '应当一无挂虑，只要凡事藉着祷告、祈求，和感谢，将你们所要的告诉神。神所赐、出人意外的平安必在基督耶稣里保守你们的心怀意念。', tags: ['挂虑','祷告','平安'] },
    { ref: '以赛亚书 43:2', text: '你从水中经过，我必与你同在；你趟过江河，水必不漫过你；你从火中行过，必不被烧，火焰也不着在你身上。', tags: ['同在','保护','水火'] },
    { ref: '约翰福音 14:27', text: '我留下平安给你们；我将我的平安赐给你们。我所赐的，不像世人所赐的。你们心里不要忧愁，也不要胆怯。', tags: ['平安','忧愁','安慰'] },
    { ref: '诗篇 27:1', text: '耶和华是我的亮光，是我的拯救，我还怕谁呢？耶和华是我性命的保障，我还惧谁呢？', tags: ['亮光','拯救','不怕'] },
    { ref: '罗马书 8:38-39', text: '因为我深信无论是死，是生，是天使，是掌权的，是有能的，是现在的事，是将来的事，是高处的，是低处的，是别的受造之物，都不能叫我们与神的爱隔绝；这爱是在我们的主基督耶稣里的。', tags: ['爱','隔绝','确信'] },
    { ref: '以弗所书 4:32', text: '并要以恩慈相待，存怜悯的心，彼此饶恕，正如神在基督里饶恕了你们一样。', tags: ['饶恕','恩慈','怜悯'] },
    { ref: '诗篇 118:24', text: '这是耶和华所定的日子，我们在其中要高兴欢喜！', tags: ['日子','欢喜','感恩'] },
    { ref: '马太福音 19:26', text: '耶稣看着他们说：在人这是不能的，在神凡事都能。', tags: ['不能','凡事都能','信心'] },
    { ref: '哥林多后书 12:9', text: '他对我说：我的恩典够你用的，因为我的能力是在人的软弱上显得完全。', tags: ['恩典','软弱','能力'] },
    { ref: '诗篇 103:2', text: '我的心哪，你要称颂耶和华！不可忘记他的一切恩惠！', tags: ['称颂','恩惠','感恩'] },
    { ref: '箴言 9:10', text: '敬畏耶和华是智慧的开端；认识至圣者便是聪明。', tags: ['敬畏','智慧','认识'] },
    { ref: '约翰福音 8:12', text: '耶稣又对众人说：我是世界的光。跟从我的，就不在黑暗里走，必要得着生命的光。', tags: ['光','黑暗','生命'] },
    { ref: '罗马书 10:9', text: '你若口里认耶稣为主，心里信神叫他从死里复活，就必得救。', tags: ['救恩','承认','信心'] },
    { ref: '诗篇 1:1-2', text: '不从恶人的计谋，不站罪人的道路，不坐亵慢人的座位，惟喜爱耶和华的律法，昼夜思想，这人便为有福！', tags: ['律法','思想','有福'] },
    { ref: '以弗所书 6:12', text: '因我们并不是与属血气的争战，乃是与那些执政的、掌权的、管辖这幽暗世界的，以及天空属灵气的恶魔争战。', tags: ['争战','属灵','仇敌'] },
    { ref: '诗篇 51:10', text: '神啊，求你为我造清洁的心，使我里面重新有正直的灵。', tags: ['清洁','更新','悔改'] },
    { ref: '马太福音 5:3', text: '虚心的人有福了！因为天国是他们的。', tags: ['虚心','天国','有福'] },
    { ref: '箴言 17:22', text: '喜乐的心乃是良药；忧伤的灵使骨枯干。', tags: ['喜乐','良药','忧伤'] },
    { ref: '约翰福音 16:33', text: '我将这些事告诉你们，是要叫你们在我里面有平安。在世上，你们有苦难；但你们可以放心，我已经胜了世界。', tags: ['平安','苦难','得胜'] },
    { ref: '诗篇 139:23-24', text: '神啊，求你鉴察我，知道我的心思，试炼我，知道我的意念，看在我里面有什么恶行没有，引导我走永生的道路。', tags: ['鉴察','心思','引导'] },
    { ref: '希伯来书 4:16', text: '所以，我们只管坦然无惧地来到施恩的宝座前，为要得怜恤，蒙恩惠，作随时的帮助。', tags: ['坦然','施恩','帮助'] },
    { ref: '哥林多前书 16:14', text: '凡你们所做的，都要凭爱心而做。', tags: ['爱心','做事','原则'] },
    { ref: '诗篇 31:24', text: '凡仰望耶和华的人，你们都要壮胆，坚固你们的心！', tags: ['仰望','壮胆','坚固'] },
    { ref: '路加福音 1:37', text: '因为，出于神的话，没有一句不带能力的。', tags: ['话语','能力','确信'] },
    { ref: '诗篇 56:3-4', text: '我惧怕的时候要倚靠你。我倚靠神，我要赞美他的话；我倚靠神，必不惧怕。血气之辈能把我怎么样呢？', tags: ['惧怕','倚靠','赞美'] },
    { ref: '以赛亚书 55:6', text: '当趁耶和华可寻找的时候寻找他，相近的时候求告他。', tags: ['寻找','求告','机会'] },
    { ref: '约翰福音 1:1', text: '太初有道，道与神同在，道就是神。', tags: ['道','神','起初'] },
    { ref: '诗篇 103:12', text: '东离西有多远，他叫我们的过犯离我们也有多远！', tags: ['过犯','赦免','距离'] },
    { ref: '箴言 3:7-8', text: '不要自以为有智慧；要敬畏耶和华，远离恶事。这便医治你的肚脐，滋润你的百骨。', tags: ['敬畏','智慧','健康'] },
    { ref: '马太福音 6:34', text: '所以，不要为明天忧虑，因为明天自有明天的忧虑；一天的难处一天当就够了。', tags: ['忧虑','明天','当日'] },
    { ref: '哥林多前书 2:9', text: '如经上所记：神为爱他的人所预备的是眼睛未曾看见，耳朵未曾听见，人心也未曾想到的。', tags: ['预备','爱','奥秘'] },
    { ref: '诗篇 34:8', text: '你们要尝尝主恩的滋味，便知道他是美善；投靠他的人有福了！', tags: ['恩典','美善','投靠'] },
    { ref: '以弗所书 5:2', text: '也要凭爱心行事，正如基督爱我们，为我们舍了自己，当作馨香的供物和祭物，献与神。', tags: ['爱心','舍己','馨香'] },
    { ref: '箴言 15:1', text: '回答柔和，使怒消退；言语暴戾，触动怒气。', tags: ['柔和','怒气','言语'] },
    { ref: '诗篇 107:1', text: '你们要称谢耶和华，因他本为善；他的慈爱永远长存！', tags: ['称谢','慈爱','永远'] },
    { ref: '约翰一书 3:18', text: '小子们哪，我们相爱，不要只在言语和舌头上，总要在行为和诚实上。', tags: ['相爱','行为','诚实'] },
    { ref: '马太福音 22:37-39', text: '耶稣对他说：你要尽心、尽性、尽意爱主你的神。这是诫命中的第一，且是最大的。其次也相仿，就是要爱人如己。', tags: ['爱神','爱人','诫命'] },
    { ref: '箴言 16:9', text: '人心筹算自己的道路，惟耶和华指引他的脚步。', tags: ['道路','指引','计划'] },
    { ref: '诗篇 143:8', text: '求你使我清晨得听你慈爱之言，因我倚靠你；求你使我知道当行的路，因我的心仰望你。', tags: ['慈爱','仰望','道路'] },
    { ref: '以赛亚书 40:29', text: '他疲乏的，他赐能力；软弱的，他加力量。', tags: ['疲乏','能力','软弱'] },
    { ref: '约翰一书 4:16', text: '神爱我们的心，我们也知道也信。神就是爱；住在爱里面的，就是住在神里面，神也住在他里面。', tags: ['爱','神','住在'] },
    { ref: '诗篇 42:8', text: '白昼，耶和华必向我施慈爱；黑夜，我要歌颂祷告赐我生命的神。', tags: ['慈爱','歌颂','祷告'] },
    { ref: '罗马书 3:23', text: '因为世人都犯了罪，亏缺了神的荣耀。', tags: ['罪','亏缺','荣耀'] },
    { ref: '箴言 28:1', text: '恶人虽无人追赶也逃跑；义人却胆壮像狮子。', tags: ['恶人','义人','胆壮'] },
    { ref: '以赛亚书 54:17', text: '凡为攻击你造成的器械必不利用；凡在审判时兴起用舌攻击你的，你必定他为有罪。这是耶和华仆人的产业，是他们从我所得的义。', tags: ['攻击','保护','无罪'] },
    { ref: '约翰福音 14:1', text: '你们心里不要忧愁，你们信神，也当信我。', tags: ['忧愁','信心','安慰'] },
    { ref: '诗篇 37:5', text: '当将你的事交托耶和华，并倚靠他，他就必成全。', tags: ['交托','倚靠','成全'] },
  ]
};

// ====== Prayer Guides ======
const PRAYER_GUIDES = {
  '晨祷': [
    { title: '清晨感恩祷告', text: '慈爱的天父，感谢你保守我度过一夜的平安。求你赐给我新的一天力量和智慧，让我所做的每一件事都能荣耀你的名。奉耶稣的名祷告，阿们！' },
    { title: '一天的托付', text: '主啊，我把今天的一切交托在你手中。求你引导我的脚步，保护我不遇见试探。愿我口中的言语、心里的意念在你面前蒙悦纳。奉耶稣的名祷告，阿们！' },
  ],
  '晚祷': [
    { title: '睡前感恩', text: '天父，感谢你赐给我这一天。我为今天所经历的一切感谢你，无论是喜乐还是困难。求你赦免我今天一切的过犯，保守我在夜间平安。奉耶稣的名祷告，阿们！' },
    { title: '安息祷告', text: '主啊，我将一切忧虑卸给你，求你赐我平安的睡眠。愿你的平安保守我的心怀意念，让我在梦中也感受到你的同在。奉耶稣的名祷告，阿们！' },
  ],
  '谢饭': [
    { title: '饭前祷告', text: '亲爱的天父，感谢你赐给我们这美好的食物。求你祝福预备食物的人，也求你让我们记得世界上还有许多人没有足够的食物。愿这顿饭滋养我们的身体，也让我们有机会分享你的爱。奉耶稣的名感谢祷告，阿们！' },
    { title: '简短谢饭', text: '天父，感谢你赐下饮食，求你祝福我们。奉耶稣的名，阿们！' },
  ],
  '感恩': [
    { title: '感恩祷告', text: '天父，我感谢你！感谢你赐给我生命、健康和每一天的恩典。谢谢你在我困难时不离不弃，在我软弱时加添力量。我为你的信实、慈爱和供应感恩。愿我的一生都成为感恩的祭献给你。奉耶稣的名祷告，阿们！' },
  ],
  '认罪': [
    { title: '认罪祷告', text: '圣洁的天父，我来到你面前承认我的罪。我知道我亏欠了你的荣耀，也伤害了身边的人。求你赦免我，用耶稣的宝血洗净我。求你给我一颗悔改的心，让我从今以后远离罪恶。奉耶稣的名祷告，阿们！' },
  ],
  '代祷': [
    { title: '为亲友代祷', text: '天父，我为我的家人、朋友代祷。求你保守他们的身体、心灵和灵魂。求你赐给他们信心、盼望和爱。求你医治有病痛的，安慰有忧伤的，引导迷失的。愿他们都认识你的救恩。奉耶稣的名祷告，阿们！' },
  ],
};

// ====== State ======
let currentPage = 'chat';
let chatHistory = [];
let isTyping = false;
let settings = loadSettings();

// ====== Utility Functions ======
function loadSettings() {
  try {
    const s = localStorage.getItem('bibleChatSettings');
    return s ? JSON.parse(s) : { apiKey: '', model: 'google/gemini-2.0-flash-exp:free', version: 'cuv', lang: 'zh' };
  } catch(e) { return { apiKey: '', model: 'google/gemini-2.0-flash-exp:free', version: 'cuv', lang: 'zh' }; }
}
function saveSettings() {
  settings.apiKey = document.getElementById('api-key').value.trim();
  settings.model = document.getElementById('ai-model').value;
  settings.version = document.getElementById('bible-version').value;
  settings.lang = document.getElementById('ui-lang').value;
  localStorage.setItem('bibleChatSettings', JSON.stringify(settings));
  showToast('设置已保存');
}
function loadChatHistory() {
  try {
    const h = localStorage.getItem('bibleChatHistory');
    if (h) chatHistory = JSON.parse(h);
  } catch(e) {}
}
function saveChatHistory() {
  localStorage.setItem('bibleChatHistory', JSON.stringify(chatHistory));
}
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;z-index:200;animation:fadeIn 0.3s;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ====== Page Navigation ======
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector('.nav-item[data-page="' + page + '"]').classList.add('active');
  if (window.innerWidth <= 768) toggleSidebar(false);
  if (page === 'daily') loadDailyVerse();
  if (page === 'search') initSearchPage();
  if (page === 'settings') loadSettingsUI();
}
function toggleSidebar(force) {
  const sb = document.getElementById('sidebar');
  const ov = document.querySelector('.sidebar-overlay');
  const open = force !== undefined ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', open);
  ov.classList.toggle('show', open);
}

// ====== Chat Functions ======
function sendQuick(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isTyping) return;
  input.value = '';
  input.style.height = 'auto';
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });
  saveChatHistory();
  hideWelcome();
  callAI(text);
}
function addMessage(role, text, time) {
  const container = document.getElementById('chat-container');
  const msg = document.createElement('div');
  msg.className = 'message ' + role;
  const t = time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  msg.innerHTML = '<div>' + escapeHtml(text) + '</div><div class="message-time">' + t + '</div>';
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}
function addTypingIndicator() {
  const container = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}
function hideWelcome() {
  const w = document.getElementById('welcome-message');
  if (w) w.style.display = 'none';
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ====== AI API Call ======
async function callAI(userMessage) {
  isTyping = true;
  document.getElementById('send-btn').disabled = true;
  addTypingIndicator();

  const apiKey = settings.apiKey;
  if (!apiKey) {
    removeTypingIndicator();
    addMessage('bot', '⚠️ 请先前往「设置」页面配置你的 OpenRouter API Key，才能使用 AI 对话功能。\n\n获取方式：访问 openrouter.ai/keys 注册免费账号，即可获得 API Key。\n\n或者你也可以先使用「经文查询」和「每日经文」功能，这些功能无需 API Key。');
    isTyping = false;
    document.getElementById('send-btn').disabled = false;
    return;
  }

  const systemPrompt = `你是「圣经聊天」的 AI 助手，一个基于圣经训练的信仰助手。你的回答必须：
1. 基于圣经原文和正统基督教教义
2. 引用相关经文时标注出处
3. 用温暖、鼓励、有智慧的语气
4. 如果用户问的问题超出圣经范围，温和地引导回信仰话题
5. 回答应当简洁但有深度，不超过300字
6. 使用中文回答
7. 重要提醒：你的回答仅供参考，鼓励用户查阅圣经原文和咨询教会牧者`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10).map(h => ({ role: h.role, content: h.content }))
  ];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Bible Chat'
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    removeTypingIndicator();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      let msg = '抱歉，AI 服务暂时不可用。';
      if (err.error?.message?.includes('rate_limit')) msg = '当前免费模型已达到速率限制，请稍后再试，或更换其他免费模型。';
      else if (err.error?.message?.includes('invalid')) msg = 'API Key 无效，请检查设置中的 API Key 是否正确。';
      else if (res.status === 402) msg = 'API 余额不足或免费额度已用完，请更换 API Key 或充值。';
      addMessage('bot', msg);
      isTyping = false;
      document.getElementById('send-btn').disabled = false;
      return;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '抱歉，我没有收到回复。';
    addMessage('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });
    saveChatHistory();
  } catch (err) {
    removeTypingIndicator();
    addMessage('bot', '网络连接失败，请检查网络后重试。如果在中国大陆，免费 API 可能有访问限制，建议开启网络加速。');
  }

  isTyping = false;
  document.getElementById('send-btn').disabled = false;
}

// ====== Chat Management ======
function newChat() {
  chatHistory = [];
  saveChatHistory();
  document.getElementById('chat-container').innerHTML = `
    <div class="welcome-message" id="welcome-message">
      <h3>🙏 欢迎来到圣经聊天</h3>
      <p>我是一个专门基于圣经训练的 AI 助手。你可以问我关于圣经的任何问题，获取经文解释、信仰指导和日常鼓励。</p>
      <div class="quick-topics">
        <span class="quick-topic" onclick="sendQuick('请解释约翰福音3:16的含义')">约翰福音3:16</span>
        <span class="quick-topic" onclick="sendQuick('什么是信心？')">什么是信心</span>
        <span class="quick-topic" onclick="sendQuick('请给我一句关于爱的经文')">关于爱</span>
        <span class="quick-topic" onclick="sendQuick('如何面对困难？')">面对困难</span>
        <span class="quick-topic" onclick="sendQuick('请解释十诫')">十诫</span>
        <span class="quick-topic" onclick="sendQuick('给我一句祷告的话')">祷告</span>
      </div>
    </div>
  `;
}
function clearChat() {
  if (!confirm('确定要清空所有聊天记录吗？')) return;
  newChat();
  showToast('聊天记录已清空');
}

// ====== Bible Search ======
function initSearchPage() {
  const filter = document.getElementById('book-filter');
  if (filter.children.length > 0) return;
  const ntBooks = BIBLE_DATA.books.filter(b => b.testament === 'NT');
  const otBooks = BIBLE_DATA.books.filter(b => b.testament === 'OT');
  let html = '<span class="book-tag active" onclick="filterByBook(this,\'all\')">全部</span>';
  ntBooks.slice(0, 10).forEach(b => {
    html += '<span class="book-tag" onclick="filterByBook(this,\'' + b.name + '\')">' + b.name + '</span>';
  });
  html += '<span class="book-tag" onclick="filterByBook(this,\'OT\')">旧约</span>';
  html += '<span class="book-tag" onclick="filterByBook(this,\'NT\')">新约</span>';
  filter.innerHTML = html;
  doSearch('');
}
function filterByBook(el, filter) {
  document.querySelectorAll('.book-tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  doSearch(document.getElementById('search-input').value, filter);
}
function doSearch(query, bookFilter) {
  query = query || document.getElementById('search-input').value;
  const list = document.getElementById('verse-list');
  let results = BIBLE_DATA.verses;

  if (bookFilter === 'OT') results = results.filter(v => {
    const book = v.ref.split(' ')[0];
    const b = BIBLE_DATA.books.find(b => b.name === book);
    return b && b.testament === 'OT';
  });
  else if (bookFilter === 'NT') results = results.filter(v => {
    const book = v.ref.split(' ')[0];
    const b = BIBLE_DATA.books.find(b => b.name === book);
    return b && b.testament === 'NT';
  });
  else if (bookFilter && bookFilter !== 'all') {
    results = results.filter(v => v.ref.includes(bookFilter));
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(v => v.text.toLowerCase().includes(q) || v.ref.toLowerCase().includes(q) || v.tags.some(t => t.includes(q)));
  }

  if (results.length === 0) {
    list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-light)">未找到相关经文，请尝试其他关键词</div>';
    return;
  }

  list.innerHTML = results.map(v => `
    <div class="verse-item" onclick="useVerse('${v.ref}')">
      <div class="ref">${v.ref}</div>
      <div class="text">${v.text}</div>
    </div>
  `).join('');
}
function useVerse(ref) {
  switchPage('chat');
  sendQuick('请解释' + ref + '的含义');
}
function loadRandomVerse() {
  const v = BIBLE_DATA.verses[Math.floor(Math.random() * BIBLE_DATA.verses.length)];
  document.getElementById('search-input').value = v.ref;
  doSearch(v.ref);
}

// ====== Daily Verse ======
function loadDailyVerse() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const idx = dayOfYear % BIBLE_DATA.verses.length;
  const v = BIBLE_DATA.verses[idx];
  document.getElementById('daily-text').textContent = '"' + v.text + '"';
  document.getElementById('daily-ref').textContent = v.ref;
  const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  document.getElementById('daily-date').textContent = today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日 ' + weekdays[today.getDay()];
}
function copyDaily() {
  const text = document.getElementById('daily-text').textContent + ' —— ' + document.getElementById('daily-ref').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
}
function shareDaily() {
  const text = document.getElementById('daily-text').textContent + ' —— ' + document.getElementById('daily-ref').textContent + ' （来自圣经聊天）';
  if (navigator.share) {
    navigator.share({ title: '每日经文', text: text });
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('已复制，可粘贴分享'));
  }
}
function discussDaily() {
  const ref = document.getElementById('daily-ref').textContent;
  switchPage('chat');
  sendQuick('请解释' + ref + '的含义和对我今天的应用');
}

// ====== Prayer ======
function submitPrayer() {
  const text = document.getElementById('prayer-input').value.trim();
  if (!text) { showToast('请先写下你的祷告'); return; }
  const container = document.getElementById('prayer-content');
  const card = document.createElement('div');
  card.className = 'prayer-card';
  const time = new Date().toLocaleString('zh-CN');
  card.innerHTML = `<h4>🙏 我的祷告</h4><p>${escapeHtml(text)}</p><p style="margin-top:8px;font-size:12px;color:var(--text-light)">${time}</p>`;
  container.prepend(card);
  document.getElementById('prayer-input').value = '';
  showToast('祷告已记录');
}
function loadPrayerGuide(type) {
  const guides = PRAYER_GUIDES[type];
  if (!guides) return;
  const container = document.getElementById('prayer-content');
  container.innerHTML = guides.map(g => `
    <div class="prayer-card">
      <h4>${g.title}</h4>
      <p>${g.text}</p>
    </div>
  `).join('');
}

// ====== Settings ======
function loadSettingsUI() {
  document.getElementById('api-key').value = settings.apiKey || '';
  document.getElementById('ai-model').value = settings.model || 'google/gemini-2.0-flash-exp:free';
  document.getElementById('bible-version').value = settings.version || 'cuv';
  document.getElementById('ui-lang').value = settings.lang || 'zh';
}
function exportChat() {
  const data = JSON.stringify(chatHistory, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bible-chat-history-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('聊天记录已导出');
}
function clearAllData() {
  if (!confirm('确定要清除所有数据吗？这将删除聊天记录和设置，不可恢复。')) return;
  localStorage.removeItem('bibleChatSettings');
  localStorage.removeItem('bibleChatHistory');
  chatHistory = [];
  settings = { apiKey: '', model: 'google/gemini-2.0-flash-exp:free', version: 'cuv', lang: 'zh' };
  showToast('所有数据已清除');
  loadSettingsUI();
}

// ====== Textarea Auto-resize ======
document.getElementById('chat-input').addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ====== Init ======
loadChatHistory();
if (chatHistory.length > 0) {
  hideWelcome();
  const container = document.getElementById('chat-container');
  chatHistory.forEach(h => addMessage(h.role, h.content));
}
loadDailyVerse();

// Check URL for API key
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('key')) {
  settings.apiKey = urlParams.get('key');
  localStorage.setItem('bibleChatSettings', JSON.stringify(settings));
  showToast('API Key 已通过链接设置');
}
