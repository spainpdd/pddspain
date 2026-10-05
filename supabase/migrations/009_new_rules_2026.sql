-- 009: изменения ПДД с 1 октября 2026 (Real Decreto 518/2026, BOE-A-2026-13889).
--  1) 73 новых вопроса (es/en/ru/hy), написаны заново, с собственными иллюстрациями из public/new-rules/;
--  2) три новых теста в конце курса (категория mixed, номера продолжают текущую нумерацию);
--  3) раздел «Полезно» «Изменения ПДД с 1.10.26» (7 страниц).
-- Идемпотентно: повторный запуск ничего не дублирует и не затирает правки из админки.
-- Армянский текст — машинный перевод (status = 'machine'), его стоит вычитать носителю.

-- ---------- вопросы ----------

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '001', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '001');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$¿Quién puede circular en poblado sin utilizar el cinturón de seguridad por razón de su actividad?$t$, $t$Los conductores de taxi y los distribuidores de mercancías mientras trabajan.$t$, $t$Nadie, ninguna actividad profesional exime de utilizarlo.$t$, $t$Los conductores y pasajeros de los vehículos en servicios de urgencia.$t$, $t$Por razón de su actividad, en poblado solo pueden ir sin cinturón los conductores y pasajeros de vehículos de emergencia, como ambulancias, policía o bomberos, durante el servicio urgente. Los taxistas y los repartidores han dejado de estar exentos. Además, quien atiende al paciente en una ambulancia asistencial también queda exento, en cualquier vía.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '001'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Who may drive in a built-up area without a seat belt because of their occupation?$t$, $t$Taxi drivers and goods delivery drivers while working.$t$, $t$Nobody: no occupation exempts anyone from wearing it.$t$, $t$Drivers and passengers of vehicles on emergency service.$t$, $t$Because of their occupation, only the drivers and passengers of emergency vehicles, such as ambulances, police or fire services, may go without a belt in a built-up area, and only on urgent service. Taxi drivers and delivery drivers are no longer exempt. In addition, the person treating a patient in a care ambulance is exempt on any road.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '001'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Кто по роду деятельности может ехать в населённом пункте без ремня безопасности?$t$, $t$Водители такси и развозчики товаров во время работы.$t$, $t$Никто: ни одна профессия от ремня не освобождает.$t$, $t$Водители и пассажиры транспортных средств экстренных служб.$t$, $t$По роду деятельности в населённом пункте без ремня могут ехать только водители и пассажиры машин экстренных служб — скорой, полиции, пожарных — во время срочного выезда. Таксисты и развозчики больше не освобождены. Кроме того, медработник, оказывающий помощь в салоне скорой, освобождён на любой дороге.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '001'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ո՞վ կարող է իր գործունեության բնույթով պայմանավորված բնակավայրում երթևեկել առանց անվտանգության գոտու։$t$, $t$Տաքսու վարորդները և ապրանք առաքողները՝ աշխատանքի ժամանակ։$t$, $t$Ոչ ոք՝ ոչ մի մասնագիտություն չի ազատում անվտանգության գոտի կապելու պարտականությունից։$t$, $t$Արտակարգ ծառայությունների տրանսպորտային միջոցների վարորդները և ուղևորները։$t$, $t$Գործունեության բնույթով պայմանավորված՝ բնակավայրում առանց անվտանգության գոտու կարող են երթևեկել միայն արտակարգ ծառայությունների՝ շտապօգնության, ոստիկանության, հրշեջ ծառայության մեքենաների վարորդներն ու ուղևորները՝ շտապ կանչի ժամանակ։ Տաքսու վարորդներն ու ապրանք առաքողներն այլևս ազատված չեն։ Բացի այդ, շտապօգնության մեքենայի սրահում օգնություն ցուցաբերող բուժաշխատողն ազատված է ցանկացած ճանապարհի վրա։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '001'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'adelantamiento', 'own', 'rd518-2026', '002', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '002');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un turismo circula a 80 km/h por una carretera fuera de poblado limitada a 90 km/h y se dispone a adelantar a un ciclista. ¿A qué velocidad máxima puede efectuar el adelantamiento?$t$, $t$60 km/h.$t$, $t$70 km/h.$t$, $t$90 km/h.$t$, $t$Fuera de poblado, para adelantar a un ciclista hay que ir al menos 20 km/h por debajo del límite de la vía: 90 menos 20 son 70 km/h. La referencia es el límite de la carretera, no la velocidad a la que ya se circulaba. Hay que bajar antes de iniciar la maniobra y mantenerse así hasta terminarla.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '002'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A car is travelling at 80 km/h on a road outside a built-up area limited to 90 km/h and is about to overtake a cyclist. What is the maximum speed at which it may overtake?$t$, $t$60 km/h.$t$, $t$70 km/h.$t$, $t$90 km/h.$t$, $t$Outside built-up areas, to overtake a cyclist you must drive at least 20 km/h below the road's limit: 90 minus 20 is 70 km/h. The reference is the road limit, not the speed you were already doing. Slow down before starting the manoeuvre and stay at that speed until it is complete.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '002'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Легковая машина едет со скоростью 80 км/ч по загородной дороге с ограничением 90 км/ч и собирается обогнать велосипедиста. С какой максимальной скоростью можно выполнить обгон?$t$, $t$60 км/ч.$t$, $t$70 км/ч.$t$, $t$90 км/ч.$t$, $t$За городом при обгоне велосипедиста скорость должна быть минимум на 20 км/ч ниже ограничения на дороге: 90 минус 20 — это 70 км/ч. Отсчёт идёт от лимита дороги, а не от скорости, с которой вы уже ехали. Снизить скорость нужно до начала обгона и держать её до его завершения.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '002'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մարդատար ավտոմեքենան 80 km/h արագությամբ ընթանում է բնակավայրից դուրս գտնվող ճանապարհով, որտեղ սահմանափակումը 90 km/h է, և պատրաստվում է վազանցել հեծանվորդին։ Առավելագույնը ի՞նչ արագությամբ կարելի է կատարել վազանցումը։$t$, $t$60 km/h։$t$, $t$70 km/h։$t$, $t$90 km/h։$t$, $t$Բնակավայրից դուրս հեծանվորդին վազանցելիս արագությունը պետք է առնվազն 20 km/h-ով ցածր լինի ճանապարհի սահմանափակումից՝ 90 հանած 20, այսինքն՝ 70 km/h։ Հաշվարկը կատարվում է ճանապարհի սահմանափակումից, ոչ թե այն արագությունից, որով արդեն ընթանում էիք։ Արագությունը պետք է նվազեցնել վազանցումը սկսելուց առաջ և պահպանել մինչև դրա ավարտը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '002'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', '/new-rules/q03.png', 'peatones-ciclistas', 'own', 'rd518-2026', '003', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '003');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor del patinete eléctrico de la imagen, ¿cumple la norma?$t$, $t$No, porque el casco es obligatorio.$t$, $t$Sí, porque circula por un carril bici.$t$, $t$Sí, si no supera los 25 km/h.$t$, $t$Quien conduce un patinete eléctrico debe llevar casco homologado o certificado y bien abrochado, de día y de noche, y en toda vía por la que pueda circular. Ir por el carril bici o despacio no exime. Los 25 km/h son el límite de velocidad de diseño del vehículo, no una excepción para el casco.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '003'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Does the rider of the electric scooter in the picture comply with the rules?$t$, $t$No, because a helmet is compulsory.$t$, $t$Yes, because the rider is in a cycle lane.$t$, $t$Yes, if the rider does not exceed 25 km/h.$t$, $t$An e-scooter rider must wear an approved or certified, properly fastened helmet, day and night, on every road where scooters may travel. Riding in a cycle lane or slowly gives no exemption. The 25 km/h figure is the vehicle's design speed limit, not an exception to the helmet rule.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '003'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Соблюдает ли правила водитель электросамоката на картинке?$t$, $t$Нет, потому что шлем обязателен.$t$, $t$Да, потому что он едет по велополосе.$t$, $t$Да, если не превышает 25 км/ч.$t$, $t$Водитель электросамоката обязан ехать в сертифицированном шлеме, правильно застёгнутом, днём и ночью, на любой дороге, где самокатам разрешено движение. Велополоса и малая скорость от шлема не освобождают. 25 км/ч — это предел конструктивной скорости самоката, а не исключение из правила о шлеме.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '003'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Նկարում պատկերված էլեկտրական սկուտերի վարորդը պահպանո՞ւմ է կանոնները։$t$, $t$Ոչ, որովհետև սաղավարտը պարտադիր է։$t$, $t$Այո, որովհետև նա ընթանում է հեծանվային գոտիով։$t$, $t$Այո, եթե չի գերազանցում 25 km/h-ը։$t$, $t$Էլեկտրական սկուտերի վարորդը պարտավոր է երթևեկել հավաստագրված և ճիշտ ամրացված սաղավարտով՝ ցերեկը և գիշերը, ցանկացած ճանապարհի վրա, որտեղ սկուտերներին թույլատրված է երթևեկել։ Հեծանվային գոտին և ցածր արագությունը սաղավարտ կրելուց չեն ազատում։ 25 km/h-ը սկուտերի կառուցվածքային արագության սահմանն է, ոչ թե սաղավարտի կանոնից բացառություն։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '003'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'estacionamiento', 'own', 'rd518-2026', '004', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '004');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una autocaravana estacionada vacía en una rejilla el agua usada del lavabo. No contiene residuos del inodoro. ¿Está permitido?$t$, $t$Sí, porque se vierte directamente a una rejilla.$t$, $t$Sí, porque no procede del inodoro.$t$, $t$No, durante el estacionamiento no puede verter líquidos del habitáculo.$t$, $t$Con la autocaravana estacionada no se puede verter ningún líquido del habitáculo, ni siquiera el agua del lavabo ni en una rejilla. El destino del vertido o que no venga del inodoro no cambia la regla. El agua se guarda en su depósito hasta llegar a un punto donde esté permitido vaciarlo.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '004'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A parked motorhome empties used washbasin water into a drain grate. It contains no toilet waste. Is this permitted?$t$, $t$Yes, because it is poured directly into a drain grate.$t$, $t$Yes, because it does not come from the toilet.$t$, $t$No, while parked it may not discharge liquids from the living compartment.$t$, $t$While a motorhome is parked, no liquid from the living compartment may be discharged, not even washbasin water and not into a drain grate. Where it is poured, or the fact that it does not come from the toilet, changes nothing. The water stays in its tank until a point where emptying is permitted.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '004'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Из стоящего на парковке автодома сливают в решётку использованную воду из раковины. Отходов из туалета в ней нет. Разрешено ли это?$t$, $t$Да, потому что воду сливают прямо в решётку.$t$, $t$Да, потому что это не отходы из туалета.$t$, $t$Нет, во время стоянки нельзя сливать жидкости из жилого отсека.$t$, $t$Пока автодом стоит, сливать любые жидкости из жилого отсека нельзя, даже воду из раковины и даже в решётку. Куда именно сливают и что вода не из туалета, правило не меняет. Воду держат в баке до места, где слив разрешён.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '004'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Կայանատեղիում կանգնած ավտոտնից լվացարանի օգտագործված ջուրը թափում են ջրահեռացման ցանցավանդակի մեջ։ Դրանում զուգարանի թափոններ չկան։ Թույլատրվո՞ւմ է դա։$t$, $t$Այո, որովհետև ջուրը թափում են անմիջապես ցանցավանդակի մեջ։$t$, $t$Այո, որովհետև դրանք զուգարանի թափոններ չեն։$t$, $t$Ոչ, կայանման ընթացքում չի կարելի բնակելի հատվածից հեղուկներ թափել։$t$, $t$Քանի դեռ ավտոտունը կայանված է, բնակելի հատվածից որևէ հեղուկ թափել չի կարելի՝ նույնիսկ լվացարանի ջուրը և նույնիսկ ցանցավանդակի մեջ։ Թե կոնկրետ ուր են թափում, և այն, որ ջուրը զուգարանից չէ, կանոնը չի փոխում։ Ջուրը պահում են բաքում մինչև այն վայրը, որտեղ այն թափելը թույլատրված է։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '004'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '005', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '005');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una calle urbana de un solo carril, sin carril bici ni obstáculos, ¿por qué parte del carril debe circular preferentemente un ciclista?$t$, $t$Por el centro del carril.$t$, $t$Lo más cerca posible del borde derecho.$t$, $t$Por la mitad derecha, dejando margen con el borde.$t$, $t$En una calle urbana sin carril bici el ciclista va por la calzada y circula preferentemente por el centro del carril mientras sea seguro. Así se le ve mejor y le queda espacio a ambos lados para maniobrar. Puede apartarse a la derecha cuando la seguridad lo pida.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '005'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a single-lane urban street with no cycle lane and no obstacles, which part of the lane should a cyclist preferably use?$t$, $t$The centre of the lane.$t$, $t$As close as possible to the right-hand edge.$t$, $t$The right-hand half, leaving a margin from the edge.$t$, $t$On an urban street without a cycle lane, a cyclist rides on the carriageway and preferably takes the centre of the lane while it is safe. That makes them more visible and leaves room to manoeuvre on both sides. They may move to the right when safety calls for it.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '005'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На городской улице с одной полосой, без велополосы и препятствий, по какой части полосы предпочтительно ехать велосипедисту?$t$, $t$По центру полосы.$t$, $t$Как можно ближе к правому краю.$t$, $t$По правой половине, оставляя запас до края.$t$, $t$На городской улице без велополосы велосипедист едет по проезжей части и по возможности занимает центр полосы, пока это безопасно. Так его лучше видно, и по обе стороны остаётся место для манёвра. Сместиться вправо можно, когда этого требует безопасность.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '005'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Քաղաքային փողոցում, որն ունի մեկ երթևեկության գոտի և չունի հեծանվային գոտի ու խոչընդոտներ, երթևեկության գոտու ո՞ր մասով է նախընտրելի, որ ընթանա հեծանվորդը։$t$, $t$Գոտու կենտրոնով։$t$, $t$Հնարավորինս մոտ աջ եզրին։$t$, $t$Աջ կեսով՝ եզրից որոշ հեռավորություն թողնելով։$t$, $t$Հեծանվային գոտի չունեցող քաղաքային փողոցում հեծանվորդն ընթանում է երթևեկելի մասով և հնարավորության դեպքում զբաղեցնում է երթևեկության գոտու կենտրոնը, քանի դեռ դա անվտանգ է։ Այդպես նա ավելի լավ է երևում, և երկու կողմում էլ մանևրի համար տեղ է մնում։ Դեպի աջ կարելի է տեղաշարժվել, երբ դա պահանջում է անվտանգությունը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '005'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '006', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '006');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor de una motocicleta circula por una vía urbana. ¿Debe utilizar guantes de protección?$t$, $t$Sí, son obligatorios en todas las vías, igual que el calzado cerrado.$t$, $t$No, los guantes de protección solo son obligatorios en vías interurbanas.$t$, $t$Sí, salvo que circule a menos de 30 kilómetros por hora.$t$, $t$Los guantes de protección son obligatorios para el motorista solo fuera de poblado, así que en una calle urbana puede ir sin ellos. El casco y el calzado cerrado que cubre todo el pie, en cambio, son obligatorios en toda clase de vías. Los 30 km/h no tienen que ver con los guantes: son el límite al circular por el arcén durante una retención.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '006'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A motorcycle rider is travelling on an urban road. Must they wear protective gloves?$t$, $t$Yes, they are compulsory on all roads, like closed footwear.$t$, $t$No, protective gloves are compulsory only on roads outside built-up areas.$t$, $t$Yes, unless they are riding below 30 kilometres per hour.$t$, $t$Protective gloves are compulsory for motorcyclists only outside built-up areas, so on an urban street the rider may go without them. The helmet and closed footwear covering the whole foot, by contrast, are compulsory on every type of road. The 30 km/h figure has nothing to do with gloves: it is the limit for riding on the shoulder during a jam.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '006'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Мотоциклист едет по городской улице. Обязан ли он надеть защитные перчатки?$t$, $t$Да, они обязательны на любых дорогах, как и закрытая обувь.$t$, $t$Нет, защитные перчатки обязательны только на дорогах вне населённых пунктов.$t$, $t$Да, кроме случаев, когда он едет медленнее 30 км/ч.$t$, $t$Защитные перчатки обязательны для мотоциклиста только за городом, поэтому на городской улице можно ехать без них. А вот шлем и закрытая обувь, полностью закрывающая стопу, нужны на дорогах любого типа. 30 км/ч к перчаткам отношения не имеют: это предел скорости при движении по обочине в заторе.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '006'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոտոցիկլի վարորդն ընթանում է քաղաքային փողոցով։ Պարտավո՞ր է նա կրել պաշտպանիչ ձեռնոցներ։$t$, $t$Այո, դրանք պարտադիր են բոլոր ճանապարհներին, ինչպես և փակ կոշիկը։$t$, $t$Ոչ, պաշտպանիչ ձեռնոցները պարտադիր են միայն բնակավայրերից դուրս գտնվող ճանապարհներին։$t$, $t$Այո, բացառությամբ այն դեպքերի, երբ նա ընթանում է 30 km/h-ից դանդաղ։$t$, $t$Պաշտպանիչ ձեռնոցները մոտոցիկլի վարորդի համար պարտադիր են միայն բնակավայրից դուրս, ուստի քաղաքային փողոցում կարելի է երթևեկել առանց դրանց։ Իսկ սաղավարտը և ոտնաթաթն ամբողջությամբ ծածկող փակ կոշիկը պարտադիր են ցանկացած տեսակի ճանապարհի վրա։ 30 km/h-ը ձեռնոցների հետ կապ չունի. դա արագության սահմանն է խցանման ժամանակ երթևեկելի եզրագոտիով ընթանալիս։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '006'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', '/new-rules/q07.png', 'autopista-autovia', 'own', 'rd518-2026', '007', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '007');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una autovía con dos carriles en el mismo sentido hay retención y los vehículos avanzan a paso de peatón. Al acercarse un vehículo prioritario, ¿cómo deben colocarse los conductores?$t$, $t$Los de ambos carriles se desplazan a la derecha y dejan libre el lado izquierdo.$t$, $t$Los de ambos carriles permanecen en su sitio y el vehículo prioritario circula por el arcén.$t$, $t$Los del carril izquierdo se desplazan a la izquierda y los del derecho, a la derecha.$t$, $t$Con retención en autopista o autovía hay que dejar un pasillo para los vehículos de emergencia. Si hay dos carriles, el pasillo queda en el centro: el carril izquierdo se arrima a la izquierda y el derecho, a la derecha. Con tres o más carriles, el pasillo se deja entre el carril de la izquierda y el contiguo.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '007'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On an autovía with two lanes in the same direction, traffic is crawling at walking pace in a jam. As a priority vehicle approaches, how must drivers position themselves?$t$, $t$Both lanes move to the right and leave the left side free.$t$, $t$Both lanes stay where they are and the priority vehicle uses the hard shoulder.$t$, $t$The left lane moves to the left and the right lane moves to the right.$t$, $t$When a jam builds up on a motorway or dual carriageway, drivers must open a corridor for emergency vehicles. With two lanes the corridor runs down the middle: the left lane hugs the left edge and the right lane hugs the right edge. With three or more lanes the corridor goes between the leftmost lane and the one next to it.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '007'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На скоростной дороге (autovía) с двумя полосами в одном направлении образовался затор, машины ползут со скоростью пешехода. К ним приближается транспорт с приоритетом. Как должны встать водители?$t$, $t$Водители обеих полос прижимаются вправо и оставляют свободной левую сторону.$t$, $t$Водители обеих полос остаются на своих местах, а спецтранспорт едет по обочине.$t$, $t$Водители левой полосы прижимаются влево, а правой — вправо.$t$, $t$При заторе на автомагистрали или скоростной дороге нужно освободить проезд для экстренных служб. На двух полосах свободный коридор остаётся посередине: левый ряд смещается к левому краю, правый — к правому. Если полос три и больше, коридор оставляют между крайней левой полосой и соседней.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '007'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Արագընթաց ճանապարհին (autovía), որն ունի երկու երթևեկության գոտի մեկ ուղղությամբ, խցանում է առաջացել, և մեքենաները շարժվում են հետիոտնի արագությամբ։ Նրանց մոտենում է առաջնահերթ տրանսպորտային միջոց։ Ինչպե՞ս պետք է դիրքավորվեն վարորդները։$t$, $t$Երկու գոտիների վարորդներն էլ տեղաշարժվում են դեպի աջ և ազատ են թողնում ձախ կողմը։$t$, $t$Երկու գոտիների վարորդներն էլ մնում են իրենց տեղերում, իսկ առաջնահերթ տրանսպորտային միջոցն ընթանում է երթևեկելի եզրագոտիով։$t$, $t$Ձախ գոտու վարորդները տեղաշարժվում են դեպի ձախ, իսկ աջ գոտու վարորդները՝ դեպի աջ։$t$, $t$Ավտոմագիստրալում (autopista) կամ արագընթաց ճանապարհին (autovía) խցանման դեպքում պետք է անցում ազատել արտակարգ ծառայությունների համար։ Երկու գոտու դեպքում ազատ միջանցքը մնում է մեջտեղում՝ ձախ շարքը տեղաշարժվում է դեպի ձախ եզրը, աջը՝ դեպի աջ եզրը։ Եթե գոտիները երեքն են կամ ավելի, միջանցքը թողնում են ամենաձախ գոտու և դրան հարևան գոտու միջև։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '007'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '008', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '008');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una persona de quince años quiere circular en patinete eléctrico por una calle que el ayuntamiento ha habilitado para estos vehículos. ¿Puede hacerlo?$t$, $t$No, porque debe tener al menos dieciséis años.$t$, $t$Sí, porque ya tiene la edad mínima exigida.$t$, $t$No, salvo que cuente con la autorización de sus padres.$t$, $t$La edad mínima para conducir un patinete eléctrico (VMP) es de 15 años, y a los quince ya se cumple. Ni se pide un año más ni sirve de nada el permiso de los padres: para menores de esa edad no hay autorización que lo permita.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '008'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A fifteen-year-old wants to ride an electric scooter along a street the council has opened to such vehicles. Can they do so?$t$, $t$No, because the rider must be at least sixteen.$t$, $t$Yes, because they already meet the minimum age.$t$, $t$No, unless they have their parents' permission.$t$, $t$The minimum age to ride an e-scooter (PMV) is 15, so a fifteen-year-old qualifies. The minimum is not sixteen, and parental consent cannot lower it for younger children.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '008'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Пятнадцатилетний подросток хочет проехать на электросамокате по улице, где муниципалитет разрешил такие средства. Можно ли ему?$t$, $t$Нет, ему должно быть не меньше шестнадцати.$t$, $t$Да, он уже достиг минимального возраста.$t$, $t$Нет, если только родители не дали разрешения.$t$, $t$Минимальный возраст для управления электросамокатом (СИМ) — 15 лет, и пятнадцатилетний его уже достиг. Шестнадцати не требуется, а согласие родителей не позволяет ездить тем, кто младше этого возраста.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '008'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Տասնհինգամյա դեռահասը ցանկանում է էլեկտրական սկուտերով երթևեկել մի փողոցով, որտեղ քաղաքապետարանը թույլատրել է նման միջոցների երթևեկությունը։ Կարո՞ղ է նա դա անել։$t$, $t$Ոչ, նա պետք է առնվազն տասնվեց տարեկան լինի։$t$, $t$Այո, նա արդեն հասել է նվազագույն տարիքին։$t$, $t$Ոչ, բացառությամբ այն դեպքի, երբ ծնողները թույլտվություն են տվել։$t$, $t$Էլեկտրական սկուտեր (անհատական շարժունակության միջոց՝ ԱՇՄ) վարելու նվազագույն տարիքը 15 տարեկանն է, և տասնհինգամյան արդեն հասել է դրան։ Տասնվեց տարեկան լինել չի պահանջվում, իսկ ծնողների համաձայնությունը թույլ չի տալիս երթևեկել նրանց, ովքեր այդ տարիքից փոքր են։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '008'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'maniobras', 'own', 'rd518-2026', '009', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '009');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un turismo va a rebasar un vehículo averiado que ocupa parte de su carril. ¿Qué debe hacer al pasar junto a él?$t$, $t$Dejar 1,5 metros de separación y reducir 20 km/h respecto al límite de la vía.$t$, $t$Dejar 1,5 metros de separación y mantener su velocidad.$t$, $t$Solo asegurarse de que puede pasar sin peligro.$t$, $t$Al pasar junto a un vehículo inmovilizado en la calzada hay que cumplir dos cosas a la vez: separarse lateralmente al menos 1,5 m y circular al menos 20 km/h por debajo del límite de la vía. Comprobar que no hay peligro no basta, y mantener la velocidad tampoco.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '009'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A car is about to pass a broken-down vehicle that takes up part of its lane. What must the driver do when passing it?$t$, $t$Leave 1.5 metres of clearance and drive at least 20 km/h below the road limit.$t$, $t$Leave 1.5 metres of clearance and keep the same speed.$t$, $t$Just make sure the pass can be made safely.$t$, $t$When passing a vehicle immobilised on the road you must do two things at once: keep at least 1.5 m of lateral clearance and drive at least 20 km/h below the speed limit. Merely checking that it is safe is not enough, and neither is keeping your speed.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '009'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Легковая машина собирается проехать мимо сломавшегося автомобиля, который занимает часть её полосы. Что должен сделать водитель при объезде?$t$, $t$Оставить боковой интервал 1,5 м и ехать как минимум на 20 км/ч медленнее ограничения на дороге.$t$, $t$Оставить боковой интервал 1,5 м и не менять скорость.$t$, $t$Просто убедиться, что объехать можно безопасно.$t$, $t$Мимо остановившегося на проезжей части транспорта нужно ехать, соблюдая сразу два условия: боковой интервал не меньше 1,5 м и скорость не менее чем на 20 км/ч ниже ограничения на этой дороге. Одной проверки безопасности мало, как и сохранения прежней скорости.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '009'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մարդատար ավտոմեքենան պատրաստվում է անցնել անսարք ավտոմեքենայի կողքով, որը զբաղեցնում է նրա երթևեկության գոտու մի մասը։ Ի՞նչ պետք է անի վարորդը շրջանցելիս։$t$, $t$Պահպանի 1,5 m կողային հեռավորություն և ընթանա ճանապարհի սահմանափակումից առնվազն 20 km/h-ով դանդաղ։$t$, $t$Պահպանի 1,5 m կողային հեռավորություն և չփոխի արագությունը։$t$, $t$Պարզապես համոզվի, որ շրջանցելն անվտանգ է։$t$, $t$Երթևեկելի մասում կանգ առած տրանսպորտային միջոցի կողքով պետք է անցնել՝ միաժամանակ պահպանելով երկու պայման՝ առնվազն 1,5 m կողային հեռավորություն և տվյալ ճանապարհի սահմանափակումից առնվազն 20 km/h-ով ցածր արագություն։ Միայն անվտանգության մեջ համոզվելը բավարար չէ, ինչպես և նախկին արագությունը պահպանելը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '009'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '010', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '010');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista adulto sube una rampa larga por una carretera convencional y lleva un certificado médico que desaconseja el casco. ¿Puede circular sin él?$t$, $t$Sí, porque se trata de una subida prolongada.$t$, $t$Sí, porque un certificado médico desaconseja el casco.$t$, $t$No, el casco es obligatorio incluso en esas circunstancias.$t$, $t$Fuera de poblado, el ciclista adulto debe llevar casco homologado o certificado y bien abrochado durante todo el trayecto. Hasta el 30 de septiembre de 2026 se admitían dos excepciones, la subida prolongada y el certificado médico, y desde el 1 de octubre de 2026 ya no existen.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '010'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$An adult cyclist is riding up a long climb on a conventional road and carries a medical certificate advising against a helmet. May they ride without one?$t$, $t$Yes, because it is a long climb.$t$, $t$Yes, because a medical certificate advises against a helmet.$t$, $t$No, a helmet is compulsory even in these circumstances.$t$, $t$Outside built-up areas an adult cyclist must wear a certified helmet, properly fastened, for the whole ride. Until 30 September 2026 two exceptions applied, a long climb and a medical certificate; from 1 October 2026 both are gone.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '010'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Взрослый велосипедист поднимается по длинному подъёму на обычной загородной дороге; у него есть справка врача, не рекомендующая шлем. Может ли он ехать без шлема?$t$, $t$Да, потому что подъём затяжной.$t$, $t$Да, потому что справка врача не рекомендует шлем.$t$, $t$Нет, шлем обязателен и в таких обстоятельствах.$t$, $t$Вне населённых пунктов взрослый велосипедист обязан ехать в сертифицированном шлеме, правильно застёгнутом, всю поездку. До 30 сентября 2026 года было два исключения — затяжной подъём и медицинская справка, с 1 октября 2026 года обоих нет.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '010'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Չափահաս հեծանվորդը երկար վերելքով բարձրանում է բնակավայրից դուրս գտնվող սովորական ճանապարհով. նա ունի բժշկի տեղեկանք, որով սաղավարտ կրելը խորհուրդ չի տրվում։ Կարո՞ղ է նա երթևեկել առանց սաղավարտի։$t$, $t$Այո, որովհետև վերելքը երկարատև է։$t$, $t$Այո, որովհետև բժշկի տեղեկանքով սաղավարտ կրելը խորհուրդ չի տրվում։$t$, $t$Ոչ, սաղավարտը պարտադիր է նաև այդպիսի հանգամանքներում։$t$, $t$Բնակավայրերից դուրս չափահաս հեծանվորդը պարտավոր է ամբողջ ուղևորության ընթացքում կրել հավաստագրված և ճիշտ ամրացված սաղավարտ։ Մինչև 2026 թվականի սեպտեմբերի 30-ը կար երկու բացառություն՝ երկարատև վերելքը և բժշկական տեղեկանքը, իսկ 2026 թվականի հոկտեմբերի 1-ից երկուսն էլ այլևս չեն գործում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '010'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'autopista-autovia', 'own', 'rd518-2026', '011', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '011');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una motocicleta queda atrapada en una retención en una autovía y el arcén derecho está libre. ¿Puede circular por él?$t$, $t$No, salvo en los tramos habilitados y señalizados para ello.$t$, $t$Sí, en cualquier vía en la que la circulación de los carriles esté detenida.$t$, $t$No, el arcén no está previsto para la circulación de motocicletas.$t$, $t$Las motos solo pueden usar el arcén en tramos que la autoridad ha habilitado y señalizado de forma permanente. Allí, con los carriles parados, deben ir en fila de uno, a un máximo de 30 km/h y con mucha precaución. Fuera de esos tramos el arcén sigue prohibido.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '011'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A motorcycle is stuck in a jam on a dual carriageway and the right-hand hard shoulder is clear. May it ride along the shoulder?$t$, $t$No, except on sections authorised and signposted for that purpose.$t$, $t$Yes, on any road where the traffic lanes are at a standstill.$t$, $t$No, the hard shoulder is not meant for motorcycles.$t$, $t$Motorcycles may use the hard shoulder only on stretches that the authority has authorised and permanently signposted. There, with the lanes stopped, they ride in single file at no more than 30 km/h and with great care. Elsewhere the shoulder stays off limits.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '011'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Мотоцикл застрял в пробке на скоростной дороге, а правая обочина свободна. Можно ли ехать по ней?$t$, $t$Нет, кроме участков, где это специально разрешено и обозначено.$t$, $t$Да, на любой дороге, где движение по полосам полностью остановилось.$t$, $t$Нет, обочина вообще не предназначена для мотоциклов.$t$, $t$Мотоциклы могут ехать по обочине только на участках, заранее одобренных властями и обозначенных постоянными знаками. Там при стоящих полосах едут в одну линию, не быстрее 30 км/ч и очень осторожно. Вне таких участков обочина по-прежнему запрещена.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '011'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոտոցիկլը խցանման մեջ է հայտնվել արագընթաց ճանապարհին (autovía), իսկ աջ երթևեկելի եզրագոտին ազատ է։ Կարելի՞ է ընթանալ դրանով։$t$, $t$Ոչ, բացառությամբ այն հատվածների, որտեղ դա հատուկ թույլատրված և նշված է։$t$, $t$Այո, ցանկացած ճանապարհի վրա, որտեղ երթևեկության գոտիներով շարժումն ամբողջությամբ կանգ է առել։$t$, $t$Ոչ, երթևեկելի եզրագոտին ընդհանրապես նախատեսված չէ մոտոցիկլների համար։$t$, $t$Մոտոցիկլները կարող են ընթանալ երթևեկելի եզրագոտիով միայն այն հատվածներում, որոնք նախապես հաստատվել են իշխանությունների կողմից և նշված են մշտական նշաններով։ Այնտեղ, երբ գոտիներում երթևեկությունը կանգնած է, ընթանում են մեկ շարքով, 30 km/h-ից ոչ արագ և մեծ զգուշությամբ։ Այդպիսի հատվածներից դուրս երթևեկելի եզրագոտիով ընթանալը շարունակում է արգելված մնալ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '011'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'velocidad', 'own', 'rd518-2026', '012', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '012');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Además de en los entornos escolares, ¿dónde deben aplicarse medidas específicas de limitación de velocidad y de calmado del tráfico?$t$, $t$Únicamente en las calles que rodean un centro escolar.$t$, $t$Solo donde ya exista un camino escolar seguro señalizado.$t$, $t$También junto a centros hospitalarios y de personas mayores o con discapacidad.$t$, $t$La norma extiende estas medidas, como límites de velocidad y calmado del tráfico, a los alrededores de hospitales y de centros para personas mayores o con discapacidad. No dependen de que exista un camino escolar señalizado.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '012'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Besides school surroundings, where must specific speed-limiting and traffic-calming measures be applied?$t$, $t$Only on the streets around a school.$t$, $t$Only where a signposted safe school route already exists.$t$, $t$Also near hospitals and centres for older people or people with disabilities.$t$, $t$The rules extend measures such as speed limits and traffic calming to the surroundings of hospitals and of centres for older people or people with disabilities. They do not depend on a signposted safe school route being in place.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '012'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Кроме окрестностей школ, где ещё должны вводиться особые меры по ограничению скорости и успокоению движения?$t$, $t$Только на улицах вокруг школы.$t$, $t$Только там, где уже обустроен обозначенный безопасный школьный маршрут.$t$, $t$Также рядом с больницами и центрами для пожилых людей и людей с инвалидностью.$t$, $t$Такие меры — ограничения скорости, успокоение движения — распространяются и на территорию вокруг больниц и центров для пожилых людей и людей с инвалидностью. Наличие обозначенного школьного маршрута для этого не нужно.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '012'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Բացի դպրոցների շրջակայքից, էլ որտե՞ղ պետք է կիրառվեն արագության սահմանափակման և երթևեկության հանդարտեցման հատուկ միջոցներ։$t$, $t$Միայն դպրոցի շուրջը գտնվող փողոցներում։$t$, $t$Միայն այնտեղ, որտեղ արդեն կահավորված է նշաններով նշված անվտանգ դպրոցական երթուղի։$t$, $t$Նաև հիվանդանոցների և տարեցների ու հաշմանդամություն ունեցող անձանց կենտրոնների մոտ։$t$, $t$Այդպիսի միջոցները՝ արագության սահմանափակումները, երթևեկության հանդարտեցումը, տարածվում են նաև հիվանդանոցների և տարեցների ու հաշմանդամություն ունեցող անձանց կենտրոնների շրջակա տարածքի վրա։ Դրա համար նշաններով նշված դպրոցական երթուղու առկայությունն անհրաժեշտ չէ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '012'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '013', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '013');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un patinete eléctrico circula por un carril bici en una vía interurbana donde no hay ninguna señal que lo prohíba. ¿Está permitido?$t$, $t$No, porque está en una vía situada fuera de poblado.$t$, $t$Sí, porque circula por un carril bici sin señal que lo prohíba.$t$, $t$Solo si también está prohibido el paso de vehículos de motor.$t$, $t$Fuera de poblado los VMP no pueden circular por autopistas, autovías ni calzadas, pero el carril bici es una excepción: pueden usarlo siempre que ninguna señal lo prohíba. No hace falta que además esté vetado a los vehículos de motor.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '013'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$An electric scooter is riding along a cycle lane on a road outside a built-up area where no sign prohibits it. Is this allowed?$t$, $t$No, because it is on a road outside a built-up area.$t$, $t$Yes, because it is on a cycle lane with no prohibiting sign.$t$, $t$Only if motor vehicles are also banned from the road.$t$, $t$Outside built-up areas personal mobility vehicles are barred from motorways, dual carriageways and the carriageway itself, but cycle lanes are an exception: they may use them unless a sign prohibits it. There is no need for motor vehicles to be banned as well.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '013'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Электросамокат едет по велополосе на загородной дороге, где нет запрещающего знака. Разрешено ли это?$t$, $t$Нет, потому что дорога находится вне населённого пункта.$t$, $t$Да, потому что он едет по велополосе, а запрещающего знака нет.$t$, $t$Только если там запрещено движение и механических транспортных средств.$t$, $t$Вне населённых пунктов СИМ нельзя ездить по автомагистралям, скоростным дорогам и проезжей части, но велополоса — исключение: пока нет запрещающего знака, ею пользоваться можно. Запрет для механических транспортных средств для этого не нужен.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '013'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Էլեկտրական սկուտերն ընթանում է հեծանվային գոտիով բնակավայրից դուրս գտնվող ճանապարհին, որտեղ արգելող նշան չկա։ Թույլատրվո՞ւմ է դա։$t$, $t$Ոչ, որովհետև ճանապարհը գտնվում է բնակավայրից դուրս։$t$, $t$Այո, որովհետև այն ընթանում է հեծանվային գոտիով, իսկ արգելող նշան չկա։$t$, $t$Միայն եթե այնտեղ արգելված է նաև մեխանիկական տրանսպորտային միջոցների երթևեկությունը։$t$, $t$Բնակավայրերից դուրս անհատական շարժունակության միջոցներին (ԱՇՄ) արգելվում է երթևեկել ավտոմագիստրալներով (autopista), արագընթաց ճանապարհներով (autovía) և երթևեկելի մասով, սակայն հեծանվային գոտին բացառություն է՝ քանի դեռ արգելող նշան չկա, դրանից կարելի է օգտվել։ Դրա համար մեխանիկական տրանսպորտային միջոցների երթևեկության արգելքն անհրաժեշտ չէ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '013'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q14.png', 'adelantamiento', 'own', 'rd518-2026', '014', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '014');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una autovía la nieve dificulta la circulación. ¿Puede un turismo adelantar a un vehículo que circula más despacio?$t$, $t$Sí, no existe ninguna prohibición específica de adelantar por la nieve.$t$, $t$No, mientras la nieve dificulte la circulación está prohibido adelantar.$t$, $t$Sí, siempre que reduzca la velocidad y extreme la precaución.$t$, $t$En autopistas y autovías, mientras la nieve dificulte la circulación el adelantamiento está prohibido, aunque delante vaya un vehículo más lento. Reducir la velocidad o extremar la precaución no levanta la prohibición.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '014'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a dual carriageway, snow is hampering traffic. May a car overtake a slower vehicle?$t$, $t$Yes, there is no specific ban on overtaking because of snow.$t$, $t$No, overtaking is prohibited while snow hampers traffic.$t$, $t$Yes, provided the driver slows down and takes extra care.$t$, $t$On motorways and dual carriageways overtaking is prohibited for as long as snow hampers traffic, even if a slower vehicle is ahead. Slowing down or taking extra care does not lift the ban.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '014'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На скоростной дороге снег мешает движению. Может ли легковой автомобиль обогнать более медленный транспорт?$t$, $t$Да, специального запрета на обгон из-за снега нет.$t$, $t$Нет, пока снег затрудняет движение, обгон запрещён.$t$, $t$Да, если снизить скорость и быть особенно внимательным.$t$, $t$На автомагистралях и скоростных дорогах обгон запрещён всё время, пока снег затрудняет движение, даже если впереди едет более медленная машина. Снижение скорости и повышенная осторожность запрета не отменяют.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '014'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Արագընթաց ճանապարհին (autovía) ձյունը խանգարում է երթևեկությանը։ Կարո՞ղ է մարդատար ավտոմեքենան վազանցել ավելի դանդաղ ընթացող տրանսպորտային միջոցին։$t$, $t$Այո, ձյան պատճառով վազանցման հատուկ արգելք չկա։$t$, $t$Ոչ, քանի դեռ ձյունը դժվարացնում է երթևեկությունը, վազանցումն արգելված է։$t$, $t$Այո, եթե նվազեցնի արագությունը և լինի հատկապես ուշադիր։$t$, $t$Ավտոմագիստրալներում (autopista) և արագընթաց ճանապարհներին (autovía) վազանցումն արգելված է այն ամբողջ ժամանակ, քանի դեռ ձյունը դժվարացնում է երթևեկությունը, նույնիսկ եթե առջևում ավելի դանդաղ մեքենա է ընթանում։ Արագության նվազեցումը և առավել զգուշությունը արգելքը չեն վերացնում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '014'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '015', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '015');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor de una motocicleta se detiene por una avería en una vía interurbana, se baja y permanece en el arcén. ¿Debe ponerse el chaleco reflectante de alta visibilidad?$t$, $t$Sí, porque ha salido del vehículo y ocupa el arcén de una vía interurbana.$t$, $t$No, porque esta obligación no se aplica a los conductores de motocicletas.$t$, $t$Solo si la motocicleta queda sobre la calzada y obstaculiza la circulación.$t$, $t$Fuera de poblado, el conductor de una motocicleta que se baja y pisa la calzada o el arcén debe ponerse el chaleco reflectante de alta visibilidad. Da igual dónde haya quedado la moto o si estorba al tráfico.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '015'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A motorcycle rider stops because of a breakdown on a road outside a built-up area, gets off and stays on the hard shoulder. Must they put on a high-visibility reflective vest?$t$, $t$Yes, because they have left the vehicle and are on the hard shoulder of a road outside a built-up area.$t$, $t$No, because this obligation does not apply to motorcycle riders.$t$, $t$Only if the motorcycle is left on the carriageway and obstructs traffic.$t$, $t$Outside built-up areas, a motorcycle rider who gets off and steps onto the carriageway or hard shoulder must put on a high-visibility reflective vest. It does not matter where the bike ended up or whether it blocks traffic.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '015'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Мотоциклист остановился из-за поломки на загородной дороге, слез с мотоцикла и стоит на обочине. Нужно ли ему надеть светоотражающий жилет?$t$, $t$Да, потому что он вышел из транспортного средства и находится на обочине загородной дороги.$t$, $t$Нет, эта обязанность не касается мотоциклистов.$t$, $t$Только если мотоцикл остался на проезжей части и мешает движению.$t$, $t$Вне населённых пунктов мотоциклист, сошедший с мотоцикла на проезжую часть или обочину, обязан надеть светоотражающий жилет повышенной видимости. Где остался мотоцикл и мешает ли он движению, значения не имеет.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '015'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոտոցիկլի վարորդն անսարքության պատճառով կանգ է առել բնակավայրից դուրս գտնվող ճանապարհին, իջել է մոտոցիկլից և կանգնած է երթևեկելի եզրագոտում։ Պե՞տք է նա հագնի լուսաանդրադարձող բաճկոն։$t$, $t$Այո, որովհետև նա դուրս է եկել տրանսպորտային միջոցից և գտնվում է բնակավայրից դուրս գտնվող ճանապարհի երթևեկելի եզրագոտում։$t$, $t$Ոչ, այդ պարտականությունը չի վերաբերում մոտոցիկլների վարորդներին։$t$, $t$Միայն եթե մոտոցիկլը մնացել է երթևեկելի մասում և խանգարում է երթևեկությանը։$t$, $t$Բնակավայրերից դուրս մոտոցիկլի վարորդը, որն իջել է մոտոցիկլից և ոտք է դրել երթևեկելի մասի կամ երթևեկելի եզրագոտու վրա, պարտավոր է հագնել բարձր տեսանելիության լուսաանդրադարձող բաճկոն։ Թե որտեղ է մնացել մոտոցիկլը և արդյոք այն խանգարում է երթևեկությանը, նշանակություն չունի։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '015'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', '/new-rules/q16.png', 'autopista-autovia', 'own', 'rd518-2026', '016', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '016');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una autopista con tres carriles en el mismo sentido los vehículos están detenidos por una retención. Al acercarse un vehículo prioritario, ¿dónde deben dejar el pasillo de emergencia los conductores?$t$, $t$Entre el carril situado más a la derecha y el contiguo.$t$, $t$Todos los conductores se desplazan a la derecha y dejan libre el lado izquierdo.$t$, $t$Entre el carril situado más a la izquierda y el contiguo.$t$, $t$Con tres o más carriles por sentido, el pasillo de emergencia se forma entre el carril de la izquierda y el que tiene al lado. Los vehículos del carril izquierdo se arriman todo lo posible a la izquierda y los de los demás carriles, todo lo posible a la derecha.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '016'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a motorway with three lanes in the same direction, vehicles are stopped in a jam. As a priority vehicle approaches, where must drivers form the emergency corridor?$t$, $t$Between the rightmost lane and the lane next to it.$t$, $t$Everyone moves to the right, leaving the left side clear.$t$, $t$Between the leftmost lane and the lane next to it.$t$, $t$With three or more lanes per direction the emergency corridor opens between the leftmost lane and its neighbour. Vehicles in the left lane squeeze as far left as they can, and those in all other lanes as far right as they can.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '016'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На автомагистрали с тремя полосами в одном направлении машины стоят в заторе. К ним приближается транспорт с приоритетом. Где водители должны оставить аварийный коридор?$t$, $t$Между крайней правой полосой и соседней с ней.$t$, $t$Все сдвигаются вправо, оставляя свободной левую сторону.$t$, $t$Между крайней левой полосой и соседней с ней.$t$, $t$Если в одном направлении три полосы и больше, аварийный коридор образуется между крайней левой полосой и соседней. Машины левого ряда прижимаются к левому краю как можно сильнее, машины всех остальных рядов — как можно сильнее вправо.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '016'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ավտոմագիստրալում (autopista), որն ունի երեք երթևեկության գոտի մեկ ուղղությամբ, մեքենաները կանգնած են խցանման մեջ։ Նրանց մոտենում է առաջնահերթ տրանսպորտային միջոց։ Որտե՞ղ պետք է վարորդները թողնեն արտակարգ միջանցքը։$t$, $t$Ամենաաջ գոտու և դրան հարևան գոտու միջև։$t$, $t$Բոլորը տեղաշարժվում են դեպի աջ՝ ազատ թողնելով ձախ կողմը։$t$, $t$Ամենաձախ գոտու և դրան հարևան գոտու միջև։$t$, $t$Եթե մեկ ուղղությամբ կա երեք կամ ավելի գոտի, արտակարգ միջանցքը ձևավորվում է ամենաձախ գոտու և դրան հարևան գոտու միջև։ Ձախ շարքի մեքենաները հնարավորինս մոտենում են ձախ եզրին, իսկ մնացած բոլոր շարքերի մեքենաները՝ հնարավորինս տեղաշարժվում դեպի աջ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '016'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q17.png', 'adelantamiento', 'own', 'rd518-2026', '017', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '017');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En un tramo urbano donde está prohibido adelantar, un turismo alcanza a un patinete eléctrico que circula lentamente. ¿Puede adelantarlo?$t$, $t$No, la prohibición también se aplica a los patinetes eléctricos.$t$, $t$Sí, siempre que no ponga en riesgo a su usuario ni a la circulación.$t$, $t$Sí, pero solo si no ocupa la parte de la calzada reservada al sentido contrario.$t$, $t$La prohibición de adelantar tiene una excepción para vehículos de movilidad personal que van tan despacio que se les puede pasar sin peligro. El conductor puede hacerlo si la maniobra no pone en riesgo ni al usuario del patinete ni al resto del tráfico; la separación lateral debe ser de al menos 1,5 m. Lo mismo vale para ciclistas, ciclomotores y peatones.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '017'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On an urban stretch where overtaking is prohibited, a car catches up with a slow electric scooter. May it overtake?$t$, $t$No, the prohibition also applies to electric scooters.$t$, $t$Yes, provided it puts neither the rider nor other traffic at risk.$t$, $t$Yes, but only if it does not enter the part of the road reserved for oncoming traffic.$t$, $t$The ban on overtaking has an exception for personal mobility vehicles moving slowly enough to be passed safely. The driver may overtake if the manoeuvre endangers neither the scooter rider nor other traffic, keeping at least 1.5 m of lateral clearance. The same applies to cyclists, mopeds and pedestrians.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '017'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На городском участке, где обгон запрещён, легковой автомобиль догоняет медленно едущий электросамокат. Можно ли его обогнать?$t$, $t$Нет, запрет распространяется и на электросамокаты.$t$, $t$Да, если это не создаёт опасности ни для самокатчика, ни для остального движения.$t$, $t$Да, но только если автомобиль не выезжает на часть дороги для встречного движения.$t$, $t$У запрета обгона есть исключение: средства индивидуальной мобильности, которые едут достаточно медленно, чтобы их безопасно объехать. Водитель вправе обогнать самокат, если манёвр не опасен ни для человека на нём, ни для остальных, соблюдая боковой интервал не менее 1,5 м. То же относится к велосипедистам, мопедам и пешеходам.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '017'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Քաղաքային հատվածում, որտեղ վազանցումն արգելված է, մարդատար ավտոմեքենան հասնում է դանդաղ ընթացող էլեկտրական սկուտերին։ Կարելի՞ է այն վազանցել։$t$, $t$Ոչ, արգելքը տարածվում է նաև էլեկտրական սկուտերների վրա։$t$, $t$Այո, եթե դա վտանգ չի ստեղծում ո՛չ սկուտերի վարորդի, ո՛չ մնացած երթևեկության համար։$t$, $t$Այո, բայց միայն եթե ավտոմեքենան դուրս չի գալիս ճանապարհի՝ հանդիպակաց երթևեկության համար նախատեսված մաս։$t$, $t$Վազանցման արգելքն ունի բացառություն՝ անհատական շարժունակության միջոցները (ԱՇՄ), որոնք ընթանում են այնքան դանդաղ, որ հնարավոր է դրանք անվտանգ շրջանցել։ Վարորդն իրավունք ունի վազանցելու սկուտերը, եթե մանևրը վտանգավոր չէ ո՛չ դրա վրա գտնվող անձի, ո՛չ մյուսների համար՝ պահպանելով առնվազն 1,5 m կողային հեռավորություն։ Նույնը վերաբերում է հեծանվորդներին, մոպեդներին և հետիոտներին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '017'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'autopista-autovia', 'own', 'rd518-2026', '018', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '018');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una autovía de dos carriles por sentido, la nieve dificulta la circulación. ¿Por qué carril debe circular un turismo?$t$, $t$Solo por el carril situado más a la derecha.$t$, $t$Por cualquiera de los dos carriles.$t$, $t$Por el carril izquierdo, dejando libre el derecho para los quitanieves.$t$, $t$Cuando la nieve dificulta la circulación en una autovía o autopista de dos carriles por sentido, los turismos van por el carril derecho. El izquierdo se deja libre para quitanieves y servicios de emergencia. Con tres o más carriles pueden usar también el contiguo al derecho.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '018'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a dual carriageway with two lanes per direction, snow is hampering traffic. Which lane must a car use?$t$, $t$Only the rightmost lane.$t$, $t$Either of the two lanes.$t$, $t$The left lane, leaving the right one clear for snowploughs.$t$, $t$When snow hampers traffic on a motorway or dual carriageway with two lanes per direction, cars stay in the right-hand lane. The left lane is left free for snowploughs and emergency services. With three or more lanes they may also use the lane next to the rightmost one.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '018'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На скоростной дороге с двумя полосами в каждом направлении снег затрудняет движение. По какой полосе должна ехать легковая машина?$t$, $t$Только по крайней правой.$t$, $t$По любой из двух полос.$t$, $t$По левой, оставив правую свободной для снегоуборочной техники.$t$, $t$Если снег затрудняет движение на автомагистрали или скоростной дороге с двумя полосами в направлении, легковые машины едут по правой полосе. Левую оставляют свободной для снегоуборщиков и экстренных служб. При трёх и более полосах им разрешена ещё и полоса рядом с крайней правой.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '018'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Արագընթաց ճանապարհին (autovía), որն ունի երկու երթևեկության գոտի յուրաքանչյուր ուղղությամբ, ձյունը դժվարացնում է երթևեկությունը։ Ո՞ր գոտիով պետք է ընթանա մարդատար ավտոմեքենան։$t$, $t$Միայն ամենաաջ գոտիով։$t$, $t$Երկու գոտիներից ցանկացածով։$t$, $t$Ձախ գոտիով՝ աջը ազատ թողնելով ձնամաքրման տեխնիկայի համար։$t$, $t$Եթե ձյունը դժվարացնում է երթևեկությունը ավտոմագիստրալում (autopista) կամ արագընթաց ճանապարհին (autovía), որն ունի երկու գոտի մեկ ուղղությամբ, մարդատար ավտոմեքենաներն ընթանում են աջ գոտիով։ Ձախ գոտին ազատ են թողնում ձնամաքրիչ մեքենաների և արտակարգ ծառայությունների համար։ Երեք և ավելի գոտիների դեպքում նրանց թույլատրվում է օգտվել նաև ամենաաջ գոտուն հարևան գոտուց։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '018'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'estacionamiento', 'own', 'rd518-2026', '019', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '019');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una autocaravana está estacionada en una plaza de aparcamiento ordinaria de la calle y su conductor quiere nivelarla. ¿Cómo puede apoyarla?$t$, $t$Sobre patas estabilizadoras, siempre que no sobresalgan del vehículo.$t$, $t$Sobre gatos niveladores, siempre que las ruedas toquen el suelo.$t$, $t$Solo sobre los neumáticos, pudiendo usar calzos o cuñas de seguridad.$t$, $t$Una autocaravana estacionada en la vía pública solo puede apoyarse en el suelo con sus neumáticos. Para nivelarla se admiten calzos o cuñas bajo las ruedas, porque el peso sigue recayendo sobre los neumáticos. Las patas estabilizadoras o los gatos niveladores añaden otros puntos de apoyo y no están permitidos.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '019'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A motorhome is parked in an ordinary street parking space and its driver wants to level it. How may it be supported?$t$, $t$On stabilising legs, as long as they do not protrude beyond the vehicle.$t$, $t$On levelling jacks, as long as the wheels still touch the ground.$t$, $t$Only on its tyres, with chocks or wedges permitted.$t$, $t$A motorhome parked on the public road may rest on the ground only through its tyres. Chocks or wedges under the wheels are fine for levelling, since the weight still sits on the tyres. Stabilising legs or levelling jacks add extra points of support and are not allowed.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '019'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Автодом стоит на обычном уличном парковочном месте, и водитель хочет его выровнять. На что можно опереть машину?$t$, $t$На опорные лапы, если они не выходят за габариты автомобиля.$t$, $t$На выравнивающие домкраты, если колёса остаются на земле.$t$, $t$Только на шины, допускаются упоры и клинья.$t$, $t$Автодом, стоящий на дороге, может опираться о покрытие только шинами. Для выравнивания можно подложить упоры или клинья под колёса: вес по-прежнему приходится на шины. Опорные лапы и выравнивающие домкраты создают дополнительные точки опоры, и ими пользоваться нельзя.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '019'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ավտոտունը կանգնած է փողոցի սովորական կայանատեղիում, և վարորդը ցանկանում է այն հավասարեցնել։ Ինչի՞ վրա կարելի է հենել մեքենան։$t$, $t$Հենաոտքերի վրա, եթե դրանք դուրս չեն գալիս ավտոմեքենայի եզրաչափերից։$t$, $t$Հավասարեցնող ամբարձիկների վրա, եթե անիվները մնում են գետնին։$t$, $t$Միայն անվադողերի վրա. թույլատրվում են հենարաններ և սեպեր։$t$, $t$Ճանապարհին կանգնած ավտոտունը կարող է ծածկույթին հենվել միայն անվադողերով։ Հավասարեցնելու համար կարելի է անիվների տակ դնել հենարաններ կամ սեպեր. քաշն առաջվա պես ընկնում է անվադողերի վրա։ Հենաոտքերը և հավասարեցնող ամբարձիկները ստեղծում են լրացուցիչ հենման կետեր, և դրանցից օգտվել չի կարելի։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '019'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '020', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '020');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor de una motocicleta circula por una vía urbana con sandalias abiertas sujetas al talón. ¿Cumple la norma?$t$, $t$No, debe llevar calzado cerrado que cubra todo el pie.$t$, $t$Sí, porque las sandalias están sujetas al talón.$t$, $t$Sí, porque el calzado cerrado solo se exige en vías interurbanas.$t$, $t$El conductor y el pasajero de una moto deben llevar calzado cerrado que cubra por completo el pie, en cualquier vía, también en ciudad. Una sandalia sujeta al talón deja parte del pie al aire. Lo que solo se exige fuera de poblado son los guantes.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '020'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A motorcycle rider is travelling on an urban road wearing open sandals secured at the heel. Are they complying with the rules?$t$, $t$No, they must wear closed footwear that covers the whole foot.$t$, $t$Yes, because the sandals are fastened at the heel.$t$, $t$Yes, because closed footwear is only required on roads outside built-up areas.$t$, $t$Motorcycle riders and passengers must wear closed footwear covering the whole foot on every road, in town as well. A sandal strapped at the heel still leaves part of the foot exposed. Only gloves are required just outside built-up areas.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '020'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Мотоциклист едет по городской улице в открытых сандалиях, закреплённых на пятке. Соблюдает ли он правила?$t$, $t$Нет, нужна закрытая обувь, полностью закрывающая стопу.$t$, $t$Да, ведь сандалии закреплены на пятке.$t$, $t$Да, ведь закрытая обувь обязательна только на дорогах вне населённых пунктов.$t$, $t$Водитель и пассажир мотоцикла обязаны носить закрытую обувь, полностью закрывающую стопу, на любой дороге — и в городе тоже. Сандалия с ремешком на пятке оставляет часть стопы открытой. Только за городом дополнительно требуются защитные перчатки.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '020'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոտոցիկլի վարորդը քաղաքային փողոցով երթևեկում է բաց սանդալներով, որոնք ամրացված են կրունկի մոտ։ Արդյո՞ք նա պահպանում է կանոնները։$t$, $t$Ոչ, անհրաժեշտ է փակ կոշիկ, որն ամբողջությամբ ծածկում է ոտնաթաթը։$t$, $t$Այո, քանի որ սանդալներն ամրացված են կրունկի մոտ։$t$, $t$Այո, քանի որ փակ կոշիկը պարտադիր է միայն բնակավայրերից դուրս գտնվող ճանապարհներին։$t$, $t$Մոտոցիկլի վարորդը և ուղևորը պարտավոր են ցանկացած ճանապարհին, այդ թվում՝ քաղաքում, կրել փակ կոշիկ, որն ամբողջությամբ ծածկում է ոտնաթաթը։ Կրունկի մոտ փոկով ամրացվող սանդալը ոտնաթաթի մի մասը բաց է թողնում։ Միայն բնակավայրից դուրս են լրացուցիչ պահանջվում պաշտպանիչ ձեռնոցներ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '020'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '021', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '021');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista circula por una zona peatonal que no es acera, donde la ordenanza municipal lo permite. ¿Actúa correctamente?$t$, $t$No, las zonas peatonales están reservadas a los peatones en todo caso.$t$, $t$Sí, si respeta las restricciones municipales y la prioridad y la seguridad de los peatones.$t$, $t$Sí, y además tiene prioridad sobre los peatones.$t$, $t$En las aceras no pueden circular vehículos. En otras zonas peatonales el ayuntamiento puede permitir bicicletas y VMP y fijar límites. Aun así, la prioridad sigue siendo de los peatones, y el ciclista debe adaptar su velocidad y su trayectoria para no ponerlos en peligro.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '021'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A cyclist is riding through a pedestrian area that is not a pavement, where a municipal by-law allows it. Is the cyclist acting correctly?$t$, $t$No, pedestrian areas are reserved for pedestrians in all cases.$t$, $t$Yes, if they observe the municipal restrictions and respect pedestrians' priority and safety.$t$, $t$Yes, and the cyclist has priority over pedestrians.$t$, $t$Vehicles may not use pavements. In other pedestrian areas the council may allow bicycles and PMVs and set limits. Even so, pedestrians keep priority, and the cyclist must adapt speed and path so as not to endanger them.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '021'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Велосипедист едет по пешеходной зоне, которая не является тротуаром, а местное постановление это допускает. Правильно ли он поступает?$t$, $t$Нет, пешеходные зоны во всех случаях предназначены только для пешеходов.$t$, $t$Да, если соблюдает ограничения муниципалитета, уступает пешеходам и не угрожает их безопасности.$t$, $t$Да, и у велосипедиста есть приоритет перед пешеходами.$t$, $t$По тротуарам ездить на транспорте нельзя. В других пешеходных зонах муниципалитет может разрешить велосипеды и СИМ и ввести свои ограничения. Но приоритет остаётся у пешеходов, и скорость с траекторией нужно выбирать так, чтобы им не угрожать.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '021'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հեծանվորդը երթևեկում է հետիոտնային գոտիով, որը մայթ չէ, և տեղական կանոնակարգը դա թույլատրում է։ Արդյո՞ք նա ճիշտ է վարվում։$t$, $t$Ոչ, հետիոտնային գոտիները բոլոր դեպքերում նախատեսված են միայն հետիոտների համար։$t$, $t$Այո, եթե պահպանում է համայնքի սահմանած սահմանափակումները, զիջում է հետիոտներին և չի վտանգում նրանց անվտանգությունը։$t$, $t$Այո, և հեծանվորդն առավելություն ունի հետիոտների նկատմամբ։$t$, $t$Մայթերով տրանսպորտային միջոցներով երթևեկելն արգելվում է։ Մյուս հետիոտնային գոտիներում համայնքը կարող է թույլատրել հեծանիվների և անհատական շարժունակության միջոցների (ԱՇՄ) երթևեկությունը և սահմանել իր սահմանափակումները։ Սակայն առավելությունը մնում է հետիոտներինը, և արագությունն ու հետագիծը պետք է ընտրել այնպես, որ նրանց վտանգ չսպառնա։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '021'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '022', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '022');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un repartidor circula durante su jornada laboral en un triciclo de pedales por una vía urbana en condiciones de calor extremo. ¿Está obligado a llevar casco de protección?$t$, $t$No, puede prescindir del casco mientras se mantenga el calor extremo.$t$, $t$Solo si circula por una travesía, aunque esté realizando su actividad profesional.$t$, $t$Sí, debe llevar casco homologado o certificado y bien abrochado.$t$, $t$Quien reparte en bicicleta, triciclo u otro vehículo de pedales como trabajo debe llevar casco certificado y abrochado también en calles urbanas. Ni el calor, ni una cuesta larga, ni un certificado médico lo eximen. Para el resto de adultos el casco es obligatorio fuera de poblado, y para los menores de 16 años, en cualquier vía.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '022'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A delivery rider is working on a pedal tricycle along an urban road in extreme heat. Must they wear a protective helmet?$t$, $t$No, they may go without a helmet while the extreme heat lasts.$t$, $t$Only if they are on a road section running through a town, even while working.$t$, $t$Yes, they must wear an approved or certified helmet, properly fastened.$t$, $t$A rider who delivers for work on a bicycle, tricycle or other pedal vehicle must wear a certified, fastened helmet on urban streets too. Heat, a long climb or a medical certificate do not exempt them. Other adults need a helmet outside built-up areas, and anyone under 16 on every road.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '022'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Курьер во время рабочей смены едет по городской улице на педальном трицикле в сильную жару. Обязан ли он носить защитный шлем?$t$, $t$Нет, пока стоит жара, шлем можно не надевать.$t$, $t$Только если дорога проходит через населённый пункт, даже во время работы.$t$, $t$Да, он обязан надеть сертифицированный шлем и правильно его застегнуть.$t$, $t$Тот, кто по работе развозит заказы на велосипеде, трицикле или другом педальном транспорте, обязан ехать в сертифицированном застёгнутом шлеме и на городских улицах. Ни жара, ни долгий подъём, ни справка врача от этого не освобождают. Остальным взрослым шлем нужен вне населённых пунктов, а детям до 16 лет — на любой дороге.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '022'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Առաքիչն աշխատանքային հերթափոխի ժամանակ սաստիկ շոգին քաղաքային փողոցով երթևեկում է ոտնակավոր եռանիվով։ Պարտավո՞ր է նա կրել պաշտպանիչ սաղավարտ։$t$, $t$Ոչ, քանի դեռ շոգ է, սաղավարտը կարելի է չկրել։$t$, $t$Միայն եթե ճանապարհն անցնում է բնակավայրի միջով, նույնիսկ աշխատանքի ժամանակ։$t$, $t$Այո, նա պարտավոր է կրել հավաստագրված սաղավարտ և ճիշտ ամրակապել այն։$t$, $t$Նա, ով աշխատանքի բերումով պատվերներ է առաքում հեծանիվով, եռանիվով կամ այլ ոտնակավոր տրանսպորտային միջոցով, պարտավոր է նաև քաղաքային փողոցներում երթևեկել հավաստագրված և ամրակապված սաղավարտով։ Ո՛չ շոգը, ո՛չ երկար վերելքը, ո՛չ բժշկի տեղեկանքը չեն ազատում այս պարտականությունից։ Մյուս չափահասների համար սաղավարտը պարտադիր է բնակավայրերից դուրս, իսկ մինչև 16 տարեկան երեխաների համար՝ ցանկացած ճանապարհին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '022'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '023', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '023');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor de un patinete eléctrico circula de noche por una vía urbana sin ningún elemento luminoso ni reflectante. ¿Cumple la norma?$t$, $t$No, debe llevar al menos un elemento luminoso o reflectante visible a 150 metros.$t$, $t$Sí, no existe esa obligación para los vehículos de movilidad personal.$t$, $t$No, debe llevar obligatoriamente un chaleco reflectante.$t$, $t$De noche o con poca visibilidad, quien conduce un VMP debe llevar al menos un elemento luminoso o reflectante que cumpla la normativa de protección individual y se vea desde 150 metros. Rige en toda clase de vías, también en la ciudad. No hace falta que sea un chaleco: sirve cualquier elemento que cumpla esos requisitos.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '023'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$The rider of an electric scooter is riding at night on an urban road with no luminous or reflective element. Is the rider complying with the rules?$t$, $t$No, the rider must wear at least one luminous or reflective element visible from 150 metres.$t$, $t$Yes, there is no such requirement for personal mobility vehicles.$t$, $t$No, the rider must wear a reflective vest.$t$, $t$At night or in poor visibility, a PMV rider must wear at least one luminous or reflective element that meets personal-protection standards and is visible from 150 metres. This applies on every type of road, towns included. It need not be a vest: any element meeting those requirements will do.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '023'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Водитель электросамоката едет ночью по городской улице без светящегося и светоотражающего элемента. Соблюдает ли он правила?$t$, $t$Нет, на нём должен быть хотя бы один светящийся или светоотражающий элемент, заметный со 150 метров.$t$, $t$Да, для средств индивидуальной мобильности такого требования нет.$t$, $t$Нет, он обязан быть именно в светоотражающем жилете.$t$, $t$Ночью и при плохой видимости водитель СИМ должен иметь хотя бы один светящийся или светоотражающий элемент, отвечающий требованиям к средствам защиты и видимый со 150 метров. Это действует на дорогах любого типа, в городе тоже. Именно жилет не обязателен: подойдёт любой элемент с такими характеристиками.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '023'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Էլեկտրական սկուտերի վարորդը գիշերը երթևեկում է քաղաքային փողոցով՝ առանց որևէ լուսատու կամ լուսաանդրադարձող տարրի։ Արդյո՞ք նա պահպանում է կանոնները։$t$, $t$Ոչ, նա պետք է կրի առնվազն մեկ լուսատու կամ լուսաանդրադարձող տարր, որը տեսանելի է 150 m հեռավորությունից։$t$, $t$Այո, անհատական շարժունակության միջոցների համար նման պահանջ չկա։$t$, $t$Ոչ, նա պարտավոր է կրել հենց լուսաանդրադարձող բաճկոն։$t$, $t$Գիշերը և վատ տեսանելիության պայմաններում անհատական շարժունակության միջոցի (ԱՇՄ) վարորդը պետք է ունենա առնվազն մեկ լուսատու կամ լուսաանդրադարձող տարր, որը համապատասխանում է անհատական պաշտպանության միջոցներին ներկայացվող պահանջներին և տեսանելի է 150 m հեռավորությունից։ Սա գործում է ցանկացած տեսակի ճանապարհներին, այդ թվում՝ քաղաքում։ Հենց բաճկոնը պարտադիր չէ․ հարմար է նման հատկանիշներ ունեցող ցանկացած տարր։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '023'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '024', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '024');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un repartidor circula durante su jornada laboral en una motocicleta por una vía urbana con buena visibilidad. ¿Debe llevar chaleco reflectante de alta visibilidad?$t$, $t$Solo si se baja de la motocicleta y ocupa la calzada o el arcén.$t$, $t$Sí, mientras circule en el ejercicio de su actividad profesional.$t$, $t$No, porque circula por una vía urbana con buena visibilidad.$t$, $t$Quien va en moto por trabajo debe llevar chaleco reflectante de alta visibilidad mientras circula por cualquier vía, también en ciudad y de día. La obligación nace de que el viaje es profesional. Lo mismo vale para ciclomotores, bicicletas y VMP usados para trabajar.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '024'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A delivery rider is riding a motorcycle on an urban road during their working day and visibility is good. Must they wear a high-visibility reflective vest?$t$, $t$Only if they get off the motorcycle and step onto the carriageway or hard shoulder.$t$, $t$Yes, while riding in the course of their professional activity.$t$, $t$No, because they are on an urban road in good visibility.$t$, $t$Anyone riding a motorcycle for work must wear a high-visibility reflective vest while moving on any road, in town and in daylight too. The duty comes from the trip being professional. The same goes for mopeds, bicycles and PMVs used for work.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '024'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Курьер во время рабочей смены едет на мотоцикле по городской дороге при хорошей видимости. Должен ли он надеть светоотражающий жилет повышенной видимости?$t$, $t$Только если сойдёт с мотоцикла и окажется на проезжей части или обочине.$t$, $t$Да, пока едет, выполняя свою профессиональную работу.$t$, $t$Нет, потому что он едет по городской дороге при хорошей видимости.$t$, $t$Кто ездит на мотоцикле по работе, обязан носить светоотражающий жилет повышенной видимости во время движения по любой дороге — в городе и днём тоже. Обязанность возникает из-за профессионального характера поездки. Так же обстоит дело с мопедами, велосипедами и СИМ, если на них ездят по работе.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '024'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Առաքիչն աշխատանքային հերթափոխի ժամանակ մոտոցիկլով երթևեկում է քաղաքային ճանապարհով՝ լավ տեսանելիության պայմաններում։ Պե՞տք է նա կրի բարձր տեսանելիության լուսաանդրադարձող բաճկոն։$t$, $t$Միայն եթե իջնի մոտոցիկլից և հայտնվի երթևեկելի մասում կամ երթևեկելի եզրագոտում։$t$, $t$Այո, քանի դեռ երթևեկում է իր մասնագիտական աշխատանքը կատարելիս։$t$, $t$Ոչ, քանի որ նա երթևեկում է քաղաքային ճանապարհով՝ լավ տեսանելիության պայմաններում։$t$, $t$Նա, ով աշխատանքի բերումով մոտոցիկլ է վարում, պարտավոր է ցանկացած ճանապարհով երթևեկելիս, այդ թվում՝ քաղաքում և ցերեկը, կրել բարձր տեսանելիության լուսաանդրադարձող բաճկոն։ Պարտականությունը ծագում է ուղևորության մասնագիտական բնույթից։ Նույնը վերաբերում է մոպեդներին, հեծանիվներին և անհատական շարժունակության միջոցներին (ԱՇՄ), եթե դրանցով երթևեկում են աշխատանքի բերումով։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '024'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '025', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '025');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una repartidora hace entregas en calles urbanas y para cada pocos minutos a cargar y descargar paquetes. Entre dos paradas, ¿puede conducir sin cinturón?$t$, $t$Sí, porque las operaciones de carga y descarga son sucesivas.$t$, $t$Sí, mientras no salga de poblado.$t$, $t$No, debe llevarlo abrochado también entre las entregas.$t$, $t$Hasta el 30 de septiembre de 2026 los repartidores quedaban exentos del cinturón en ciudad cuando hacían paradas seguidas. Desde el 1 de octubre de 2026 esa excepción ha desaparecido, así que el cinturón es obligatorio en cada tramo entre paradas.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '025'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A delivery driver is delivering on urban streets, stopping every few minutes to load and unload parcels. May she drive without a seat belt between two stops?$t$, $t$Yes, because the loading and unloading operations are successive.$t$, $t$Yes, as long as she stays within a built-up area.$t$, $t$No, she must keep it fastened between deliveries as well.$t$, $t$Until 30 September 2026 delivery drivers were exempt from the seat belt in town when making frequent stops. From 1 October 2026 that exception is gone, so the belt must be worn on every leg between stops.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '025'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Курьер развозит посылки по городу и каждые несколько минут останавливается, чтобы погрузить или выгрузить груз. Можно ли ей ехать без ремня между двумя остановками?$t$, $t$Да, ведь погрузка и разгрузка идут одна за другой.$t$, $t$Да, пока она не выезжает за пределы населённого пункта.$t$, $t$Нет, ремень должен быть пристёгнут и между доставками.$t$, $t$До 30 сентября 2026 года развозчики в городе могли не пристёгиваться при частых остановках. С 1 октября 2026 года это исключение отменено, и ремень нужен на каждом отрезке пути между остановками.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '025'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Առաքիչը քաղաքում ծանրոցներ է առաքում և մի քանի րոպեն մեկ կանգ է առնում՝ բեռը բարձելու կամ բեռնաթափելու համար։ Կարո՞ղ է նա երկու կանգառների միջև երթևեկել առանց անվտանգության գոտու։$t$, $t$Այո, քանի որ բեռնումն ու բեռնաթափումը հաջորդում են մեկը մյուսին։$t$, $t$Այո, քանի դեռ նա դուրս չի գալիս բնակավայրի սահմաններից։$t$, $t$Ոչ, անվտանգության գոտին պետք է ամրակապված լինի նաև առաքումների միջև։$t$, $t$Մինչև 2026 թվականի սեպտեմբերի 30-ը քաղաքում առաքիչները հաճախակի կանգառների դեպքում կարող էին չամրակապվել։ 2026 թվականի հոկտեմբերի 1-ից այս բացառությունը վերացվել է, և անվտանգության գոտին պարտադիր է կանգառների միջև ճանապարհի յուրաքանչյուր հատվածում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '025'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '026', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '026');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Durante una práctica de conducción en una vía urbana, el profesor acompaña al alumno y se hace cargo de los mandos adicionales. ¿Puede circular sin cinturón de seguridad?$t$, $t$Sí, siempre que se haga cargo de los mandos adicionales.$t$, $t$Sí, pero únicamente mientras circulen por vías urbanas.$t$, $t$No, debe llevarlo correctamente abrochado durante la práctica.$t$, $t$El profesor de autoescuela debe ir con el cinturón abrochado durante la práctica, en ciudad y fuera de ella. Antes del 1 de octubre de 2026 tenía una excepción en vías urbanas, que ya no existe. Los mandos adicionales no sustituyen al cinturón.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '026'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$During a driving lesson on an urban road, the instructor accompanies the learner and is in charge of the dual controls. May the instructor travel without a seat belt?$t$, $t$Yes, provided the instructor is in charge of the dual controls.$t$, $t$Yes, but only while they travel on urban roads.$t$, $t$No, the instructor must wear it properly fastened during the lesson.$t$, $t$A driving instructor must keep the seat belt fastened during the lesson, in town and outside it. Before 1 October 2026 there was an exception on urban roads, which no longer exists. Dual controls are no substitute for the belt.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '026'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Во время занятия по вождению на городской улице инструктор сидит рядом с учеником и отвечает за дополнительные органы управления. Можно ли ему ехать без ремня?$t$, $t$Да, если он берёт на себя дополнительные органы управления.$t$, $t$Да, но только пока они едут по городским улицам.$t$, $t$Нет, во время занятия он должен быть правильно пристёгнут.$t$, $t$Инструктор автошколы обязан быть пристёгнутым ремнём на протяжении всего занятия — и в городе, и за городом. До 1 октября 2026 года на городских улицах для него было исключение, теперь его нет. Дополнительные педали ремень не заменяют.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '026'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Քաղաքային փողոցում վարելու գործնական պարապմունքի ժամանակ հրահանգիչը նստած է սովորողի կողքին և պատասխանատու է կառավարման լրացուցիչ միջոցների համար։ Կարո՞ղ է նա երթևեկել առանց անվտանգության գոտու։$t$, $t$Այո, եթե նա իր վրա է վերցնում կառավարման լրացուցիչ միջոցները։$t$, $t$Այո, բայց միայն քանի դեռ նրանք երթևեկում են քաղաքային փողոցներով։$t$, $t$Ոչ, պարապմունքի ժամանակ նա պետք է ճիշտ ամրակապված լինի։$t$, $t$Ավտոդպրոցի հրահանգիչը պարտավոր է անվտանգության գոտիով ամրակապված լինել ամբողջ պարապմունքի ընթացքում՝ թե՛ քաղաքում, թե՛ քաղաքից դուրս։ Մինչև 2026 թվականի հոկտեմբերի 1-ը քաղաքային փողոցներում նրա համար բացառություն էր գործում, այժմ այն այլևս չկա։ Լրացուցիչ ոտնակները չեն փոխարինում անվտանգության գոտուն։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '026'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'autopista-autovia', 'own', 'rd518-2026', '027', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '027');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un peatón hace autostop en la explanada de una estación de peaje de una autopista. ¿Está permitido?$t$, $t$No, los peatones no pueden pedir que los lleven en ningún tramo, tampoco en las explanadas de peaje.$t$, $t$Sí, la prohibición afecta solo a los conductores, que deben ignorar las peticiones.$t$, $t$Sí, siempre que no invada la calzada.$t$, $t$A los peatones no se les permite circular por autopistas y autovías salvo en casos expresamente previstos, ni tampoco hacer autostop en ningún punto de ellas. La prohibición abarca las explanadas de peaje, y no importa si pisan o no la calzada.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '027'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A pedestrian is hitch-hiking on the forecourt of a motorway toll station. Is this allowed?$t$, $t$No, pedestrians may not ask for a lift on any section, toll forecourts included.$t$, $t$Yes, the ban applies only to drivers, who must ignore such requests.$t$, $t$Yes, as long as the pedestrian does not step onto the carriageway.$t$, $t$Pedestrians may not use motorways and dual carriageways except in expressly listed cases, and may not hitch-hike anywhere on them. The ban includes toll forecourts, and it makes no difference whether the person steps onto the carriageway.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '027'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Пешеход голосует на площадке пункта оплаты автомагистрали, прося подвезти. Разрешено ли это?$t$, $t$Нет, пешеходам нельзя просить подвезти ни на одном участке, включая площадки пунктов оплаты.$t$, $t$Да, запрет касается только водителей, которые обязаны игнорировать такие просьбы.$t$, $t$Да, если пешеход не выходит на проезжую часть.$t$, $t$По автомагистралям и скоростным дорогам пешеходам ходить нельзя, кроме прямо оговорённых случаев, и просить подвезти нельзя нигде на них. Запрет действует и на площадках пунктов оплаты, а выходит ли человек на проезжую часть, значения не имеет.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '027'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հետիոտնը ավտոմագիստրալի (autopista) վճարակետի հարթակում ձեռքով մեքենա է կանգնեցնում՝ խնդրելով իրեն տանել։ Արդյո՞ք դա թույլատրվում է։$t$, $t$Ոչ, հետիոտներին արգելվում է խնդրել, որ իրենց տանեն, որևէ հատվածում, ներառյալ վճարակետերի հարթակները։$t$, $t$Այո, արգելքը վերաբերում է միայն վարորդներին, որոնք պարտավոր են անտեսել նման խնդրանքները։$t$, $t$Այո, եթե հետիոտնը դուրս չի գալիս երթևեկելի մաս։$t$, $t$Ավտոմագիստրալներով (autopista) և արագընթաց ճանապարհներով (autovía) հետիոտներին արգելվում է քայլել, բացառությամբ ուղղակիորեն նախատեսված դեպքերի, և դրանց ոչ մի հատվածում չի կարելի խնդրել, որ իրենց տանեն։ Արգելքը գործում է նաև վճարակետերի հարթակներում, իսկ թե մարդը դուրս է գալիս երթևեկելի մաս, թե ոչ, նշանակություն չունի։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '027'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q28.png', 'peatones-ciclistas', 'own', 'rd518-2026', '028', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '028');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una vía con al menos dos carriles por sentido, un ciclista abandona el carril derecho porque unas obras impiden circular por él con seguridad. ¿Puede circular por otro carril?$t$, $t$No, debe circular siempre por el carril derecho.$t$, $t$Sí, cuando sea necesario por razones de seguridad.$t$, $t$Sí, pero solo para realizar un cambio de dirección.$t$, $t$En vías urbanas con dos o más carriles por sentido el ciclista va por el carril derecho, pero puede dejarlo cuando la seguridad lo exige, por ejemplo por unas obras, y también para girar. Dentro del carril que utilice, lo preferible es ir por el centro mientras sea seguro.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '028'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a road with at least two lanes in each direction, a cyclist leaves the right-hand lane because roadworks make it unsafe to continue in it. May the cyclist ride in another lane?$t$, $t$No, the cyclist must always stay in the right-hand lane.$t$, $t$Yes, when it is necessary for safety reasons.$t$, $t$Yes, but only to make a turn.$t$, $t$On urban roads with two or more lanes per direction cyclists use the right-hand lane, but may leave it when safety requires, for example because of roadworks, and also to turn. Within the lane they use, the preferred position is the centre as long as it is safe.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '028'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На дороге с как минимум двумя полосами в каждом направлении велосипедист уходит с правой полосы, потому что из-за дорожных работ ехать по ней небезопасно. Можно ли ему ехать по другой полосе?$t$, $t$Нет, он всегда обязан ехать по правой полосе.$t$, $t$Да, когда это необходимо ради безопасности.$t$, $t$Да, но только чтобы повернуть.$t$, $t$На городских дорогах с двумя и более полосами в направлении велосипедист едет по правой полосе, но может её покинуть, если этого требует безопасность, например из-за дорожных работ, а также для поворота. В пределах выбранной полосы лучше держаться ближе к центру, пока это безопасно.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '028'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Յուրաքանչյուր ուղղությամբ առնվազն երկու երթևեկության գոտի ունեցող ճանապարհին հեծանվորդը հեռանում է աջ գոտուց, քանի որ ճանապարհային աշխատանքների պատճառով դրանով երթևեկելն անվտանգ չէ։ Կարո՞ղ է նա երթևեկել այլ գոտիով։$t$, $t$Ոչ, նա միշտ պարտավոր է երթևեկել աջ գոտիով։$t$, $t$Այո, երբ դա անհրաժեշտ է անվտանգության նկատառումներով։$t$, $t$Այո, բայց միայն շրջադարձ կատարելու համար։$t$, $t$Մեկ ուղղությամբ երկու և ավելի երթևեկության գոտի ունեցող քաղաքային ճանապարհներին հեծանվորդը երթևեկում է աջ գոտիով, բայց կարող է լքել այն, եթե դա պահանջում է անվտանգությունը, օրինակ՝ ճանապարհային աշխատանքների պատճառով, ինչպես նաև շրջադարձ կատարելու համար։ Ընտրված գոտու սահմաններում նախընտրելի է մնալ կենտրոնին մոտ, քանի դեռ դա անվտանգ է։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '028'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '029', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '029');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una vía urbana, un turismo sigue a un ciclista por el mismo carril y deja cuatro metros entre ambos. ¿Es correcta esta separación?$t$, $t$No, debe dejar al menos cinco metros.$t$, $t$Sí, si circula a velocidad moderada.$t$, $t$Sí, si puede frenar sin chocar con él.$t$, $t$En vías urbanas, el conductor de un vehículo de motor que va detrás de un ciclista en su mismo carril debe dejar al menos cinco metros. Cuatro metros no bastan, aunque la velocidad sea moderada y aunque se pudiera frenar a tiempo.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '029'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On an urban road, a car is following a cyclist in the same lane, leaving four metres between them. Is this separation correct?$t$, $t$No, the driver must leave at least five metres.$t$, $t$Yes, if the driver is travelling at a moderate speed.$t$, $t$Yes, if the driver can brake without hitting the cyclist.$t$, $t$On urban roads a motor-vehicle driver following a cyclist in the same lane must keep at least five metres back. Four metres is not enough, even at moderate speed or if the driver could stop in time.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '029'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На городской дороге легковая машина едет за велосипедистом по той же полосе, оставляя между ними четыре метра. Правильна ли такая дистанция?$t$, $t$Нет, нужно оставить не менее пяти метров.$t$, $t$Да, если водитель едет с умеренной скоростью.$t$, $t$Да, если водитель успеет затормозить, не задев велосипедиста.$t$, $t$В городе водитель механического транспортного средства, следующего за велосипедистом по той же полосе, должен держать дистанцию не менее пяти метров. Четырёх мало, даже при умеренной скорости и даже если успеть затормозить.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '029'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Քաղաքային ճանապարհին մարդատար ավտոմեքենան երթևեկում է հեծանվորդի հետևից նույն գոտիով՝ նրանց միջև թողնելով չորս մետր։ Արդյո՞ք այդ հեռավորությունը ճիշտ է։$t$, $t$Ոչ, պետք է թողնել առնվազն հինգ մետր։$t$, $t$Այո, եթե վարորդը երթևեկում է չափավոր արագությամբ։$t$, $t$Այո, եթե վարորդը կհասցնի արգելակել՝ առանց հեծանվորդին դիպչելու։$t$, $t$Քաղաքում մեխանիկական տրանսպորտային միջոցի վարորդը, որը նույն գոտիով երթևեկում է հեծանվորդի հետևից, պետք է պահպանի առնվազն հինգ մետր հեռավորություն։ Չորս մետրը բավարար չէ, նույնիսկ չափավոր արագության դեպքում և նույնիսկ եթե հնարավոր լինի ժամանակին արգելակել։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '029'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'adelantamiento', 'own', 'rd518-2026', '030', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '030');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un turismo adelanta a un peatón que camina por la calzada de una calle de poblado sin acera. ¿Qué separación lateral mínima debe dejar?$t$, $t$En poblado no hay una separación mínima fijada; basta con que sea suficiente.$t$, $t$1 metro.$t$, $t$1,5 metros.$t$, $t$Al adelantar a peatones, también dentro de poblado, hay que dejar al menos 1,5 m de separación lateral y extremar la precaución. Si hay más de un carril en el sentido de la marcha, el adelantamiento se hace cambiando por completo al carril contiguo. Fuera de poblado, además, se debe ir 20 km/h por debajo del límite de la vía durante la maniobra.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '030'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A car overtakes a pedestrian walking on the carriageway of a street in a built-up area that has no pavement. What minimum lateral clearance must the driver leave?$t$, $t$In built-up areas no minimum is set; it only has to be sufficient.$t$, $t$1 metre.$t$, $t$1.5 metres.$t$, $t$When overtaking pedestrians, including inside built-up areas, you must leave at least 1.5 m of lateral clearance and take extra care. If there is more than one lane in your direction, you overtake by changing fully into the next lane. Outside built-up areas you must also stay 20 km/h below the road limit during the manoeuvre.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '030'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Легковая машина обгоняет пешехода, идущего по проезжей части улицы в населённом пункте, где нет тротуара. Какой минимальный боковой интервал нужно оставить?$t$, $t$В населённом пункте минимума нет, достаточно, чтобы интервал был достаточным.$t$, $t$1 метр.$t$, $t$1,5 метра.$t$, $t$При обгоне пешеходов, в том числе в населённом пункте, нужно оставить боковой интервал не менее 1,5 м и проявить особую осторожность. Если в направлении больше одной полосы, обгон выполняют, полностью перестроившись на соседнюю. За городом на время манёвра скорость ещё и должна быть на 20 км/ч ниже ограничения на дороге.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '030'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մարդատար ավտոմեքենան վազանցում է հետիոտնին, որը քայլում է բնակավայրի՝ մայթ չունեցող փողոցի երթևեկելի մասով։ Նվազագույն ի՞նչ կողային հեռավորություն պետք է թողնել։$t$, $t$Բնակավայրում նվազագույն չափ սահմանված չէ․ բավական է, որ հեռավորությունը բավարար լինի։$t$, $t$1 m։$t$, $t$1,5 m։$t$, $t$Հետիոտներին վազանցելիս, այդ թվում՝ բնակավայրում, պետք է թողնել առնվազն 1,5 m կողային հեռավորություն և ցուցաբերել առանձնահատուկ զգուշություն։ Եթե տվյալ ուղղությամբ կա մեկից ավելի երթևեկության գոտի, վազանցումը կատարվում է ամբողջությամբ հարևան գոտի տեղափոխվելով։ Բնակավայրից դուրս մանևրի ընթացքում արագությունը նաև պետք է 20 km/h-ով ցածր լինի ճանապարհին սահմանված սահմանափակումից։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '030'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q31.png', 'adelantamiento', 'own', 'rd518-2026', '031', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '031');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una intersección regulada por semáforo hay retención. Un ciclista rebasa por la derecha a los vehículos detenidos para ocupar la zona de espera adelantada marcada en la calzada. ¿Está permitido?$t$, $t$No, debe esperar detrás del último vehículo.$t$, $t$Sí, si avanzar por ese lado resulta más seguro.$t$, $t$Sí, pero únicamente por el lado izquierdo.$t$, $t$Ante un semáforo con tráfico retenido, el ciclista puede pasar junto a los vehículos parados para llegar a la zona de espera adelantada. Puede hacerlo por la derecha o por la izquierda; elige el lado más seguro. Así los conductores lo ven mejor y puede arrancar delante de los coches.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '031'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$At a traffic-light-controlled intersection there is congestion. A cyclist passes the stationary vehicles on the right to reach the advanced waiting area marked on the carriageway. Is this permitted?$t$, $t$No, the cyclist must wait behind the last vehicle.$t$, $t$Yes, if passing on that side is safer.$t$, $t$Yes, but only on the left-hand side.$t$, $t$At a signal with queuing traffic, a cyclist may filter past stopped vehicles to reach the advanced waiting area. They may pass on either the right or the left, choosing the safer side. That way drivers see them better and they can start ahead of the cars.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '031'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На перекрёстке со светофором затор. Велосипедист проезжает справа мимо стоящих машин, чтобы занять размеченную перед ними зону ожидания. Разрешено ли это?$t$, $t$Нет, он должен ждать позади последней машины.$t$, $t$Да, если с этой стороны безопаснее.$t$, $t$Да, но только слева.$t$, $t$У светофора с очередью велосипедист может проехать мимо стоящих машин в выдвинутую зону ожидания. Объезжать можно как справа, так и слева, выбирая более безопасную сторону. Там его лучше видно водителям, и стартовать он может перед машинами.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '031'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Լուսացույցով կարգավորվող խաչմերուկում խցանում է։ Հեծանվորդն աջ կողմից անցնում է կանգնած ավտոմեքենաների կողքով, որպեսզի զբաղեցնի դրանց առջև գծանշված սպասման գոտին։ Արդյո՞ք դա թույլատրվում է։$t$, $t$Ոչ, նա պետք է սպասի վերջին ավտոմեքենայի հետևում։$t$, $t$Այո, եթե այդ կողմից ավելի անվտանգ է։$t$, $t$Այո, բայց միայն ձախ կողմից։$t$, $t$Հերթ գոյացած լուսացույցի մոտ հեծանվորդը կարող է կանգնած ավտոմեքենաների կողքով անցնել առաջ տարված սպասման գոտի։ Շրջանցել կարելի է ինչպես աջից, այնպես էլ ձախից՝ ընտրելով ավելի անվտանգ կողմը։ Այնտեղ վարորդները նրան ավելի լավ են տեսնում, և նա կարող է շարժվել ավտոմեքենաներից առաջ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '031'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q32.png', 'velocidad', 'own', 'rd518-2026', '032', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '032');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una vía urbana de un solo carril limitada a 30 km/h, la autoridad municipal ha autorizado con señales que las bicicletas circulen en ambos sentidos. Un turismo que circula en el sentido propio de la vía se encuentra de frente con una bicicleta. Aunque ambos se arriman a su derecha, no pueden cruzarse con seguridad. ¿Quién tiene prioridad?$t$, $t$La bicicleta, por ser su conductor un usuario vulnerable.$t$, $t$El turismo, por circular en el sentido propio de la vía.$t$, $t$El vehículo que haya llegado primero al punto de cruce.$t$, $t$Cuando una calle de un carril a 30 km/h o menos permite bicicletas en los dos sentidos, ambos se arriman a su derecha para cruzarse. Si aun así no caben, pasa primero el que circula en el sentido propio de la vía, aquí el turismo. Ser usuario vulnerable obliga a extremar la precaución, pero no da prioridad.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '032'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a single-lane urban road with a 30 km/h limit, the municipality has authorised bicycles to travel in both directions by means of signs. A car travelling in the road's own direction meets an oncoming bicycle. Although both move to their right, they cannot pass safely. Who has priority?$t$, $t$The bicycle, because its rider is a vulnerable road user.$t$, $t$The car, because it is travelling in the road's own direction.$t$, $t$Whoever reached the meeting point first.$t$, $t$When a single-lane street limited to 30 km/h or less allows bicycles in both directions, both move to their right to pass. If there is still not enough room, the one travelling in the street's own direction goes first, here the car. Being a vulnerable user calls for extra care but gives no priority.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '032'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На городской улице с одной полосой и ограничением 30 км/ч власти знаками разрешили велосипедам ехать в обоих направлениях. Легковая машина, едущая по разрешённому для улицы направлению, встречает велосипед. Оба прижались вправо, но безопасно разъехаться не получается. У кого приоритет?$t$, $t$У велосипеда, потому что велосипедист — уязвимый участник движения.$t$, $t$У автомобиля, потому что он едет в установленном для улицы направлении.$t$, $t$У того, кто первым доехал до места встречи.$t$, $t$Когда на улице с одной полосой и ограничением 30 км/ч и ниже разрешены велосипеды в обоих направлениях, при встрече оба прижимаются вправо. Если места всё равно не хватает, первым едет тот, кто движется в основном направлении улицы, то есть автомобиль. Статус уязвимого участника требует особой осторожности, но приоритета не даёт.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '032'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մեկ երթևեկության գոտի և 30 km/h սահմանափակում ունեցող քաղաքային փողոցում իշխանությունները նշաններով թույլատրել են հեծանիվներին երթևեկել երկու ուղղությամբ։ Փողոցի համար սահմանված ուղղությամբ երթևեկող մարդատար ավտոմեքենան հանդիպում է դիմացից եկող հեծանիվի։ Երկուսն էլ սեղմվել են աջ, բայց անվտանգ կերպով իրար կողքով անցնել չի հաջողվում։ Ո՞վ ունի առավելություն։$t$, $t$Հեծանիվը, քանի որ հեծանվորդը երթևեկության խոցելի մասնակից է։$t$, $t$Ավտոմեքենան, քանի որ այն երթևեկում է փողոցի համար սահմանված ուղղությամբ։$t$, $t$Նա, ով առաջինն է հասել հանդիպման վայրին։$t$, $t$Երբ մեկ երթևեկության գոտի և 30 km/h կամ ավելի ցածր սահմանափակում ունեցող փողոցում թույլատրված է հեծանիվների երթևեկությունը երկու ուղղությամբ, հանդիպելիս երկուսն էլ սեղմվում են աջ։ Եթե տեղը, միևնույն է, չի բավականացնում, առաջինն անցնում է նա, ով շարժվում է փողոցի հիմնական ուղղությամբ, այսինքն՝ ավտոմեքենան։ Խոցելի մասնակցի կարգավիճակը պահանջում է առանձնահատուկ զգուշություն, բայց առավելություն չի տալիս։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '032'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'luces', 'own', 'rd518-2026', '033', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '033');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$(Norma aplicable desde el 1 de octubre de 2027.) Un conductor circula de día en un patinete eléctrico por una calle con buena visibilidad. ¿Puede llevar apagado el alumbrado?$t$, $t$Sí, porque durante el día hay suficiente visibilidad.$t$, $t$Sí, si circula únicamente por una vía urbana.$t$, $t$No, debe llevarlo encendido durante todo el trayecto.$t$, $t$Desde el 1 de octubre de 2027 el alumbrado de los VMP debe estar encendido durante todo el trayecto, también de día y con buena visibilidad. Hasta entonces, la obligación de llevar luces de día no se aplica. La luz permanente ayuda a que otros usuarios vean antes un vehículo tan pequeño.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '033'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$(Rule applicable from 1 October 2027.) A rider is riding an electric scooter during the day along a street with good visibility. May the rider keep the lights switched off?$t$, $t$Yes, because there is enough visibility during the day.$t$, $t$Yes, if the rider travels only on an urban road.$t$, $t$No, the lights must be on throughout the journey.$t$, $t$From 1 October 2027 a PMV's lights must be on for the whole journey, by day and in good visibility too. Until then the daytime-lights duty does not yet apply. Permanent lighting helps other road users notice such a small vehicle sooner.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '033'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$(Норма действует с 1 октября 2027 года.) Водитель едет днём на электросамокате по улице с хорошей видимостью. Может ли он держать свет выключенным?$t$, $t$Да, потому что днём видимость достаточна.$t$, $t$Да, если он едет только по городской улице.$t$, $t$Нет, свет должен быть включён всю поездку.$t$, $t$С 1 октября 2027 года световые приборы СИМ должны гореть на протяжении всей поездки, в том числе днём и при хорошей видимости. До этой даты обязанность включать свет днём ещё не действует. Постоянный свет помогает другим участникам раньше заметить столь маленькое транспортное средство.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '033'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$(Նորմը գործում է 2027 թվականի հոկտեմբերի 1-ից։) Վարորդը ցերեկը էլեկտրական սկուտերով երթևեկում է լավ տեսանելիությամբ փողոցով։ Կարո՞ղ է նա լույսերն անջատած պահել։$t$, $t$Այո, քանի որ ցերեկը տեսանելիությունը բավարար է։$t$, $t$Այո, եթե նա երթևեկում է միայն քաղաքային փողոցով։$t$, $t$Ոչ, լույսերը պետք է միացված լինեն ամբողջ ուղևորության ընթացքում։$t$, $t$2027 թվականի հոկտեմբերի 1-ից անհատական շարժունակության միջոցների (ԱՇՄ) լուսային սարքերը պետք է միացված լինեն ամբողջ ուղևորության ընթացքում, այդ թվում՝ ցերեկը և լավ տեսանելիության պայմաններում։ Մինչև այդ ամսաթիվը ցերեկը լույսերը միացնելու պարտականությունը դեռ չի գործում։ Մշտապես միացված լույսն օգնում է երթևեկության մյուս մասնակիցներին ավելի վաղ նկատել այդքան փոքր տրանսպորտային միջոցը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '033'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '034', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '034');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un peatón camina por una calle con aceras a ambos lados. ¿Está obligado a utilizar la acera de la derecha en el sentido de su marcha?$t$, $t$No, puede utilizar cualquiera de las dos aceras.$t$, $t$Sí, debe circular por la acera de la derecha.$t$, $t$Sí, salvo que la acera de la derecha esté ocupada.$t$, $t$Hasta el 30 de septiembre de 2026 había que ir por la acera de la derecha. Ahora el peatón puede usar cualquiera de las dos, sin que influya el sentido en que camina. Eso sí, sigue debiendo moverse sin estorbar a los demás.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '034'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A pedestrian is walking along a street with pavements on both sides. Must the pedestrian use the right-hand pavement in the direction of travel?$t$, $t$No, the pedestrian may use either pavement.$t$, $t$Yes, the pedestrian must use the right-hand pavement.$t$, $t$Yes, unless the right-hand pavement is occupied.$t$, $t$Until 30 September 2026 pedestrians had to keep to the right-hand pavement. Now they may use either one, whatever direction they are walking. They must still move without getting in other people's way.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '034'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Пешеход идёт по улице, где тротуары с обеих сторон. Обязан ли он идти по правому тротуару по ходу движения?$t$, $t$Нет, он может идти по любому из двух тротуаров.$t$, $t$Да, он должен идти по правому тротуару.$t$, $t$Да, если только правый тротуар не занят.$t$, $t$До 30 сентября 2026 года идти нужно было по правому тротуару. Теперь пешеход вправе выбрать любой из двух, независимо от направления. Но по-прежнему нужно двигаться так, чтобы не мешать другим.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '034'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հետիոտնը քայլում է փողոցով, որի երկու կողմերում էլ մայթեր կան։ Պարտավո՞ր է նա քայլել իր շարժման ուղղությամբ աջ մայթով։$t$, $t$Ոչ, նա կարող է քայլել երկու մայթերից ցանկացածով։$t$, $t$Այո, նա պետք է քայլի աջ մայթով։$t$, $t$Այո, բացառությամբ այն դեպքի, երբ աջ մայթը զբաղված է։$t$, $t$Մինչև 2026 թվականի սեպտեմբերի 30-ը պետք էր քայլել աջ մայթով։ Այժմ հետիոտնն իրավունք ունի ընտրելու երկուսից ցանկացածը՝ անկախ ուղղությունից։ Սակայն առաջվա պես պետք է շարժվել այնպես, որ մյուսներին չխանգարի։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '034'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'luces', 'own', 'rd518-2026', '035', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '035');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En un paso para peatones con semáforo propio, la luz amarilla intermitente para vehículos empieza a parpadear mientras permanece encendida la luz verde fija para peatones. ¿Es correcta esta combinación?$t$, $t$No. Como norma general, ambas luces no pueden coincidir.$t$, $t$Sí, siempre que los conductores cedan el paso a los peatones.$t$, $t$Sí, si antes se había encendido la luz roja para los vehículos.$t$, $t$En pasos con semáforo propio para peatones, el amarillo intermitente para vehículos y el verde fijo para peatones no deben coincidir por regla general. Ceder el paso no hace válida la coincidencia ni el haber tenido antes el rojo. Los conductores deben extremar la precaución ante el amarillo intermitente.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '035'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$At a pedestrian crossing with its own signal, the flashing amber light for vehicles begins to flash while the steady green light for pedestrians remains on. Is this signal combination correct?$t$, $t$No. As a general rule, the two lights may not be on together.$t$, $t$Yes, provided drivers give way to pedestrians.$t$, $t$Yes, if the red light for vehicles was on beforehand.$t$, $t$At crossings with a pedestrian signal of their own, the flashing amber for vehicles and the steady green for pedestrians should not coincide as a general rule. Yielding does not make the overlap valid, nor does an earlier red. Drivers must take extra care at flashing amber.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '035'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На пешеходном переходе с отдельным светофором для пешеходов мигающий жёлтый сигнал для транспорта загорается, пока для пешеходов горит постоянный зелёный. Правильно ли такое сочетание?$t$, $t$Нет. По общему правилу эти сигналы не должны гореть одновременно.$t$, $t$Да, если водители уступают дорогу пешеходам.$t$, $t$Да, если перед этим для транспорта горел красный.$t$, $t$На переходах с отдельным светофором для пешеходов мигающий жёлтый для транспорта и постоянный зелёный для пешеходов по общему правилу не должны совпадать. Уступка дороги этого не оправдывает, как и предшествующий красный. При мигающем жёлтом водителям нужна повышенная осторожность.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '035'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հետիոտների համար առանձին լուսացույց ունեցող հետիոտնային անցումում տրանսպորտային միջոցների համար թարթող դեղին ազդանշանը միանում է, մինչ հետիոտների համար վառվում է մշտական կանաչը։ Արդյո՞ք նման համակցությունը ճիշտ է։$t$, $t$Ոչ։ Ընդհանուր կանոնի համաձայն՝ այս ազդանշանները չպետք է միաժամանակ վառվեն։$t$, $t$Այո, եթե վարորդները ճանապարհը զիջում են հետիոտներին։$t$, $t$Այո, եթե դրանից առաջ տրանսպորտային միջոցների համար վառվում էր կարմիրը։$t$, $t$Հետիոտների համար առանձին լուսացույց ունեցող անցումներում տրանսպորտային միջոցների համար թարթող դեղինը և հետիոտների համար մշտական կանաչը, ընդհանուր կանոնի համաձայն, չպետք է համընկնեն։ Ճանապարհը զիջելը դա չի արդարացնում, ինչպես և նախորդած կարմիր ազդանշանը։ Թարթող դեղինի դեպքում վարորդները պետք է ցուցաբերեն բարձր զգուշություն։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '035'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'adelantamiento', 'own', 'rd518-2026', '036', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '036');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Fuera de poblado, el conductor de un turismo adelanta a una motocicleta en una carretera con un carril por sentido. ¿Debe dejar, en todo caso, una separación lateral mínima de 1,5 metros?$t$, $t$Sí, siempre debe dejar como mínimo 1,5 metros de separación lateral.$t$, $t$Solo debe dejar 1,5 metros si la motocicleta circula por el arcén.$t$, $t$No, debe dejar una separación lateral suficiente para adelantar con seguridad.$t$, $t$Para adelantar a una motocicleta rige la regla general: una separación lateral suficiente para hacerlo con seguridad, sin una cifra mínima fija. Los 1,5 m obligatorios se aplican a peatones, animales, ciclistas y usuarios de VMP. Si no hay espacio para una separación segura, no se adelanta.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '036'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Outside a built-up area, a car driver overtakes a motorcycle on a road with one lane in each direction. Must the driver leave a lateral clearance of at least 1.5 metres in all cases?$t$, $t$Yes, the driver must always leave at least 1.5 metres of lateral clearance.$t$, $t$The driver must leave 1.5 metres only if the motorcycle is on the hard shoulder.$t$, $t$No, the driver must leave sufficient lateral clearance to overtake safely.$t$, $t$For overtaking a motorcycle the general rule applies: enough lateral clearance to do it safely, with no fixed minimum figure. The mandatory 1.5 m applies to pedestrians, animals, cyclists and PMV users. If there is no room for a safe gap, you do not overtake.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '036'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Вне населённого пункта водитель легкового автомобиля обгоняет мотоцикл на дороге с одной полосой в каждом направлении. Обязан ли он в любом случае оставить боковой интервал не менее 1,5 метра?$t$, $t$Да, он всегда должен оставить боковой интервал не менее 1,5 м.$t$, $t$Он должен оставить 1,5 м только если мотоцикл едет по обочине.$t$, $t$Нет, нужно оставить боковой интервал, достаточный для безопасного обгона.$t$, $t$При обгоне мотоцикла действует общее правило: боковой интервал должен быть достаточным для безопасного манёвра, а твёрдого минимального значения нет. Обязательные 1,5 м относятся к пешеходам, животным, велосипедистам и пользователям СИМ. Если места для безопасного интервала нет, обгон не начинают.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '036'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Բնակավայրից դուրս մարդատար ավտոմեքենայի վարորդը վազանցում է մոտոցիկլին յուրաքանչյուր ուղղությամբ մեկ երթևեկության գոտի ունեցող ճանապարհին։ Պարտավո՞ր է նա ցանկացած դեպքում թողնել առնվազն 1,5 m կողային հեռավորություն։$t$, $t$Այո, նա միշտ պետք է թողնի առնվազն 1,5 m կողային հեռավորություն։$t$, $t$Նա պետք է թողնի 1,5 m միայն այն դեպքում, եթե մոտոցիկլը երթևեկում է երթևեկելի եզրագոտիով։$t$, $t$Ոչ, պետք է թողնել անվտանգ վազանցման համար բավարար կողային հեռավորություն։$t$, $t$Մոտոցիկլին վազանցելիս գործում է ընդհանուր կանոնը․ կողային հեռավորությունը պետք է բավարար լինի անվտանգ մանևրի համար, իսկ հստակ նվազագույն արժեք սահմանված չէ։ Պարտադիր 1,5 m-ը վերաբերում է հետիոտներին, կենդանիներին, հեծանվորդներին և անհատական շարժունակության միջոցների (ԱՇՄ) օգտագործողներին։ Եթե անվտանգ հեռավորության համար տեղ չկա, վազանցումը չեն սկսում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '036'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '037', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '037');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un taxi circula por una calle urbana. El conductor no lleva cinturón y un niño de 90 centímetros viaja detrás sin sistema de retención infantil. ¿Quién incumple la norma?$t$, $t$Solo el niño.$t$, $t$Solo el conductor.$t$, $t$Ninguno de los dos.$t$, $t$Desde el 1 de octubre de 2026 el taxista debe ir con cinturón en un trayecto normal, porque se ha suprimido su excepción. En cambio sigue vigente la excepción urbana para menores de 135 cm: en un taxi pueden ir sin sistema de retención infantil si viajan detrás. El niño de 90 cm está en el asiento trasero, así que no incumple.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '037'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A taxi is travelling along an urban street. The driver is not wearing a seat belt, and a 90-centimetre-tall child is riding in the back without a child restraint. Who is breaking the rule?$t$, $t$Only the child.$t$, $t$Only the driver.$t$, $t$Neither of them.$t$, $t$Since 1 October 2026 a taxi driver must wear the seat belt on an ordinary journey, because that exception has been removed. The urban exception for children under 135 cm remains: in a taxi they may travel without a child restraint if they sit in the back. The 90 cm child is on the rear seat, so is not at fault.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '037'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Такси едет по городской улице. Водитель не пристёгнут, а ребёнок ростом 90 сантиметров сидит сзади без детского удерживающего устройства. Кто нарушает правила?$t$, $t$Только ребёнок.$t$, $t$Только водитель.$t$, $t$Никто из них.$t$, $t$С 1 октября 2026 года таксист обязан быть пристёгнут при обычной поездке: прежнее исключение для него отменено. А вот городское исключение для детей ниже 135 см сохранилось: в такси они могут ехать без детского кресла, если сидят сзади. Ребёнок ростом 90 см сидит на заднем сиденье, поэтому он не нарушает.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '037'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Տաքսին երթևեկում է քաղաքային փողոցով։ Վարորդն ամրակապված չէ, իսկ 90 cm հասակ ունեցող երեխան նստած է հետևում՝ առանց մանկական պահող սարքի։ Ո՞վ է խախտում կանոնները։$t$, $t$Միայն երեխան։$t$, $t$Միայն վարորդը։$t$, $t$Նրանցից ոչ մեկը։$t$, $t$2026 թվականի հոկտեմբերի 1-ից տաքսու վարորդը պարտավոր է սովորական ուղևորության ժամանակ ամրակապված լինել․ նրա համար գործող նախկին բացառությունը վերացվել է։ Իսկ ահա 135 cm-ից ցածր հասակ ունեցող երեխաների համար քաղաքային բացառությունը պահպանվել է․ տաքսիում նրանք կարող են երթևեկել առանց մանկական պահող սարքի, եթե նստած են հետևում։ 90 cm հասակ ունեցող երեխան նստած է հետևի նստատեղին, ուստի նա կանոնները չի խախտում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '037'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '038', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '038');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor de un patinete eléctrico va a girar. ¿Cómo debe advertirlo a los demás usuarios?$t$, $t$Con el intermitente del patinete o con el brazo, a su elección.$t$, $t$No necesita advertirlo si circula por un carril bici.$t$, $t$Siempre con el brazo, en la forma establecida para las señales ópticas.$t$, $t$Antes del 1 de octubre de 2026 se podía usar el intermitente o el brazo. Ahora quien conduce un VMP debe avisar siempre con el brazo, con antelación y en la posición que corresponda a cada dirección. El carril bici no exime de hacerlo.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '038'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$The rider of an electric scooter is about to turn. How must the rider warn other road users?$t$, $t$With the scooter's indicator or with the arm, at the rider's choice.$t$, $t$No warning is needed when riding in a cycle lane.$t$, $t$Always with the arm, in the manner laid down for optical signals.$t$, $t$Before 1 October 2026 either an indicator or an arm signal was allowed. Now a PMV rider must always signal with the arm, in good time and in the position for the intended direction. Riding in a cycle lane does not remove the duty.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '038'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Водитель электросамоката собирается повернуть. Как он должен предупредить остальных участников движения?$t$, $t$Указателем поворота самоката или рукой, по своему выбору.$t$, $t$Предупреждать не нужно, если он едет по велополосе.$t$, $t$Всегда рукой, в порядке, установленном для оптических сигналов.$t$, $t$До 1 октября 2026 года можно было пользоваться и указателем, и рукой. Теперь водитель СИМ всегда подаёт сигнал рукой, заранее и в положении, соответствующем нужному направлению. Велополоса от этого не освобождает.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '038'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Էլեկտրական սկուտերի վարորդը պատրաստվում է շրջադարձ կատարել։ Ինչպե՞ս պետք է նա նախազգուշացնի երթևեկության մյուս մասնակիցներին։$t$, $t$Սկուտերի շրջադարձի ցուցիչով կամ ձեռքով՝ իր ընտրությամբ։$t$, $t$Նախազգուշացնել պետք չէ, եթե նա երթևեկում է հեծանվային գոտիով։$t$, $t$Միշտ ձեռքով՝ օպտիկական ազդանշանների համար սահմանված կարգով։$t$, $t$Մինչև 2026 թվականի հոկտեմբերի 1-ը կարելի էր օգտվել և՛ ցուցիչից, և՛ ձեռքից։ Այժմ անհատական շարժունակության միջոցի (ԱՇՄ) վարորդը միշտ ազդանշանը տալիս է ձեռքով՝ նախապես և անհրաժեշտ ուղղությանը համապատասխանող դիրքով։ Հեծանվային գոտին դրանից չի ազատում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '038'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q39.png', 'adelantamiento', 'own', 'rd518-2026', '039', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '039');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En poblado, un turismo adelanta a un grupo de ciclistas y vuelve al carril aprovechando un hueco entre ellos, sin haber rebasado al grupo completo. ¿Es correcto?$t$, $t$Sí, si mantiene al menos 1,5 metros de separación lateral.$t$, $t$No, porque el conjunto se considera una única unidad móvil.$t$, $t$Sí, si regresa de forma gradual sin obligarlos a frenar.$t$, $t$Un grupo de ciclistas cuenta como una sola unidad móvil, así que el adelantamiento solo termina cuando se ha rebasado al último. Hasta entonces no se puede volver al carril por un hueco del grupo. Hay que guardar 1,5 m de separación, y fuera de poblado, además, ir 20 km/h por debajo del límite.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '039'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$In a built-up area, a car overtakes a group of cyclists and moves back into the lane through a gap between them, without having passed the whole group. Is this correct?$t$, $t$Yes, if the car keeps a lateral clearance of at least 1.5 metres.$t$, $t$No, because the group counts as a single moving unit.$t$, $t$Yes, if the car moves back gradually without making the cyclists brake.$t$, $t$A group of cyclists counts as one moving unit, so the overtaking is complete only once the last rider has been passed. Until then you cannot pull back in through a gap in the group. Keep 1.5 m clear, and outside built-up areas also stay 20 km/h below the limit.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '039'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$В населённом пункте легковая машина обгоняет группу велосипедистов и возвращается в свою полосу через промежуток между ними, не обогнав всю группу. Правильно ли это?$t$, $t$Да, если боковой интервал не меньше 1,5 м.$t$, $t$Нет, потому что группа считается единым движущимся объектом.$t$, $t$Да, если машина возвращается плавно и не вынуждает велосипедистов тормозить.$t$, $t$Группа велосипедистов считается одним движущимся объектом, поэтому обгон завершается только после последнего из них. Раньше возвращаться в полосу через промежуток внутри группы нельзя. Интервал — не менее 1,5 м, а вне населённых пунктов ещё и скорость на 20 км/ч ниже ограничения.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '039'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Բնակավայրում մարդատար ավտոմեքենան վազանցում է հեծանվորդների խմբին և վերադառնում իր գոտի նրանց միջև եղած բացվածքով՝ առանց ամբողջ խմբին վազանցելու։ Ճի՞շտ է արդյոք դա։$t$, $t$Այո, եթե կողային հեռավորությունը 1,5 m-ից պակաս չէ։$t$, $t$Ոչ, որովհետև խումբը համարվում է մեկ միասնական շարժվող միավոր։$t$, $t$Այո, եթե ավտոմեքենան վերադառնում է սահուն և հեծանվորդներին չի ստիպում արգելակել։$t$, $t$Հեծանվորդների խումբը համարվում է մեկ շարժվող միավոր, ուստի վազանցումն ավարտվում է միայն նրանցից վերջինին անցնելուց հետո։ Մինչ այդ չի կարելի վերադառնալ գոտի խմբի ներսում եղած բացվածքով։ Կողային հեռավորությունը պետք է լինի առնվազն 1,5 m, իսկ բնակավայրերից դուրս նաև արագությունը պետք է լինի սահմանափակումից 20 km/h ցածր։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '039'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '040', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '040');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista mayor de edad lleva a un niño en un asiento adicional homologado por una carretera convencional de noche. ¿Es correcto?$t$, $t$No, fuera de poblado el transporte de pasajeros en bicicleta solo se permite de día y con buena visibilidad.$t$, $t$Sí, si el niño lleva casco y el asiento está homologado.$t$, $t$Sí, siempre que la bicicleta lleve las luces encendidas.$t$, $t$Fuera de poblado, llevar pasajeros o carga en bicicleta solo está permitido de día y sin condiciones que reduzcan la visibilidad. De noche no se puede transportar a un niño, aunque el asiento esté homologado y la bici lleve luces. En poblado no existe la restricción horaria, pero sí los requisitos del asiento.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '040'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$An adult cyclist is carrying a child in a type-approved child seat on a conventional road outside a built-up area at night. Is this correct?$t$, $t$No, outside built-up areas passengers may be carried on a bicycle only by day and in good visibility.$t$, $t$Yes, if the child wears a helmet and the seat is type-approved.$t$, $t$Yes, provided the bicycle has its lights on.$t$, $t$Outside built-up areas, carrying passengers or cargo on a bicycle is allowed only by day and without conditions that reduce visibility. At night you cannot carry a child, even in an approved seat and with lights on. In towns there is no time-of-day limit, but the seat requirements still apply.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '040'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Взрослый велосипедист везёт ребёнка в одобренном дополнительном сиденье по обычной загородной дороге ночью. Правильно ли это?$t$, $t$Нет, вне населённых пунктов возить пассажиров на велосипеде можно только днём и при хорошей видимости.$t$, $t$Да, если ребёнок в шлеме, а сиденье одобрено.$t$, $t$Да, если на велосипеде включён свет.$t$, $t$Вне населённых пунктов возить пассажира или груз на велосипеде разрешено только днём и при условиях, не ухудшающих видимость. Ночью ребёнка перевозить нельзя, даже в одобренном кресле и с включённым светом. В населённых пунктах ограничения по времени суток нет, но требования к сиденью остаются.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '040'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Չափահաս հեծանվորդը գիշերը բնակավայրից դուրս գտնվող սովորական ճանապարհով երեխա է տեղափոխում հաստատված տիպի լրացուցիչ նստատեղով։ Ճի՞շտ է արդյոք դա։$t$, $t$Ոչ, բնակավայրերից դուրս հեծանիվով ուղևորներ տեղափոխել թույլատրվում է միայն ցերեկը և լավ տեսանելիության պայմաններում։$t$, $t$Այո, եթե երեխան սաղավարտով է, իսկ նստատեղը հաստատված տիպի է։$t$, $t$Այո, եթե հեծանվի լույսերը միացված են։$t$, $t$Բնակավայրերից դուրս հեծանիվով ուղևոր կամ բեռ տեղափոխելը թույլատրվում է միայն ցերեկը և տեսանելիությունը չվատթարացնող պայմաններում։ Գիշերը երեխա տեղափոխել չի կարելի, նույնիսկ հաստատված տիպի նստատեղով և միացված լույսերով։ Բնակավայրերում օրվա ժամի հետ կապված սահմանափակում չկա, սակայն նստատեղին ներկայացվող պահանջները պահպանվում են։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '040'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'senales', 'own', 'rd518-2026', '041', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '041');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una pasajera viaja en el sidecar de una moto por una calle urbana con sandalias. ¿Circula correctamente?$t$, $t$No, también debe llevar calzado que le cubra todo el pie.$t$, $t$Sí, porque la obligación solo afecta a quien conduce.$t$, $t$Sí, porque el calzado cerrado solo se exige fuera de poblado.$t$, $t$El calzado cerrado que cubre todo el pie es obligatorio para el conductor y para los pasajeros de la moto, también en el sidecar, y en todas las vías, urbanas o no. Las sandalias dejan parte del pie al descubierto. La excepción está pensada solo para motos con estructura protectora y cinturones, según su documentación.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '041'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A passenger is riding in a motorcycle sidecar on an urban street wearing sandals. Is she complying with the rules?$t$, $t$No, the passenger must also wear footwear that covers the whole foot.$t$, $t$Yes, because the requirement applies only to the rider.$t$, $t$Yes, because closed footwear is only required outside built-up areas.$t$, $t$Footwear that covers the whole foot is compulsory for the rider and for passengers, sidecar passengers included, on all roads, urban or not. Sandals leave part of the foot exposed. The exception is only for motorcycles with a protective structure and belts, as stated in their documents.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '041'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Пассажирка едет в коляске мотоцикла по городской улице в сандалиях. Соблюдает ли она правила?$t$, $t$Нет, пассажир тоже обязан быть в обуви, закрывающей всю стопу.$t$, $t$Да, это требование касается только водителя.$t$, $t$Да, закрытая обувь нужна только вне населённых пунктов.$t$, $t$Закрытая обувь, полностью закрывающая стопу, обязательна для водителя и пассажиров мотоцикла, в том числе в коляске, на любых дорогах — городских и загородных. Сандалии оставляют часть стопы открытой. Исключение сделано только для мотоциклов с защитной конструкцией и ремнями, если это указано в их документах.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '041'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Կին ուղևորը մոտոցիկլի կողասայլակում սանդալներով երթևեկում է քաղաքային փողոցով։ Պահպանո՞ւմ է արդյոք նա կանոնները։$t$, $t$Ոչ, ուղևորը նույնպես պարտավոր է կրել ամբողջ ոտնաթաթը ծածկող կոշիկ։$t$, $t$Այո, այս պահանջը վերաբերում է միայն վարորդին։$t$, $t$Այո, փակ կոշիկ պահանջվում է միայն բնակավայրերից դուրս։$t$, $t$Ոտնաթաթն ամբողջությամբ ծածկող փակ կոշիկը պարտադիր է մոտոցիկլի վարորդի և ուղևորների համար, այդ թվում՝ կողասայլակում, բոլոր ճանապարհներին՝ թե՛ քաղաքային, թե՛ բնակավայրերից դուրս։ Սանդալները ոտնաթաթի մի մասը բաց են թողնում։ Բացառություն արված է միայն պաշտպանիչ կառուցվածք և անվտանգության գոտիներ ունեցող մոտոցիկլների համար, եթե դա նշված է դրանց փաստաթղթերում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '041'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'estacionamiento', 'own', 'rd518-2026', '042', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '042');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un turismo ocupado únicamente por su conductor lleva la tarjeta de estacionamiento para personas con discapacidad y movilidad reducida. ¿Puede circular por un carril VAO?$t$, $t$No, salvo que el vehículo lleve además la señal V-15.$t$, $t$Sí, en las mismas condiciones de circulación establecidas para los VAO.$t$, $t$No, porque debe alcanzar el número mínimo de ocupantes exigido.$t$, $t$Un turismo con una sola persona puede usar el carril VAO si exhibe la señal V-15 o la tarjeta de estacionamiento para personas con movilidad reducida. Cualquiera de las dos basta; no hacen falta ambas. Debe respetar las condiciones de circulación fijadas para ese tramo.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '042'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A passenger car occupied only by its driver displays the parking card for people with disabilities and reduced mobility. May it use an HOV lane?$t$, $t$No, unless the vehicle also displays the V-15 sign.$t$, $t$Yes, under the same traffic conditions laid down for HOV vehicles.$t$, $t$No, because it must have the minimum number of occupants.$t$, $t$A car with only the driver on board may use the HOV lane if it shows the V-15 sign or the parking card for people with reduced mobility. Either one is enough; both are not required. The driver must follow the traffic conditions set for that stretch.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '042'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Легковой автомобиль, в котором только водитель, имеет парковочную карту для автомобилей людей с инвалидностью и ограниченной подвижностью. Можно ли ему ехать по полосе VAO?$t$, $t$Нет, если только на нём нет ещё и знака V-15.$t$, $t$Да, на тех же условиях движения, что установлены для VAO.$t$, $t$Нет, потому что в машине должно быть минимально необходимое число людей.$t$, $t$Автомобиль с одним водителем вправе ехать по полосе VAO, если на нём есть знак V-15 или парковочная карта для людей с ограниченной подвижностью. Достаточно одного из двух, оба не нужны. Условия движения, установленные для участка, нужно соблюдать.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '042'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մարդատար ավտոմեքենան, որում միայն վարորդն է, ունի հաշմանդամություն և սահմանափակ շարժունակություն ունեցող անձանց ավտոմեքենաների կայանման քարտ։ Կարո՞ղ է այն երթևեկել VAO գոտիով (բարձր զբաղվածությամբ ավտոմեքենաների համար)։$t$, $t$Ոչ, բացառությամբ այն դեպքի, երբ դրա վրա կա նաև V-15 նշանը։$t$, $t$Այո, երթևեկության նույն պայմաններով, որոնք սահմանված են VAO-ի համար։$t$, $t$Ոչ, որովհետև ավտոմեքենայում պետք է լինի մարդկանց նվազագույն պահանջվող թիվը։$t$, $t$Միայն վարորդով ավտոմեքենան իրավունք ունի երթևեկելու VAO գոտիով, եթե դրա վրա կա V-15 նշանը կամ սահմանափակ շարժունակություն ունեցող անձանց կայանման քարտը։ Բավական է երկուսից մեկը, երկուսն էլ պետք չեն։ Տվյալ հատվածի համար սահմանված երթևեկության պայմանները պետք է պահպանել։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '042'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '043', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '043');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista mayor de edad lleva a un niño en un remolque acoplado a su bicicleta por una calle de poblado. ¿Está permitido?$t$, $t$No, en un remolque de bicicleta no se pueden transportar personas.$t$, $t$Sí, sin ninguna condición.$t$, $t$Sí, si el remolque cumple los requisitos técnicos exigidos.$t$, $t$Se puede llevar a un niño en un remolque de bicicleta si el conductor es mayor de edad y se cumplen las reglas de transporte seguro: el niño debe ir sin riesgo de caerse y sin comprometer la estabilidad. Las características técnicas de los remolques se fijarán por orden ministerial; hasta entonces se pueden usar. Fuera de poblado solo de día y con buena visibilidad.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '043'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$An adult cyclist is carrying a child in a trailer attached to the bicycle along a street in a built-up area. Is this allowed?$t$, $t$No, people may not be carried in a bicycle trailer.$t$, $t$Yes, without any conditions.$t$, $t$Yes, if the trailer meets the required technical specifications.$t$, $t$A child may be carried in a bicycle trailer if the rider is an adult and the safe-carriage rules are met: the child must not be able to fall out and the bicycle must remain stable. The technical specifications for trailers will be set by a later order; until then trailers may be used. Outside built-up areas only by day and in good visibility.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '043'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Взрослый велосипедист везёт ребёнка в прицепе, прикреплённом к велосипеду, по улице населённого пункта. Разрешено ли это?$t$, $t$Нет, в велосипедных прицепах нельзя перевозить людей.$t$, $t$Да, без каких-либо условий.$t$, $t$Да, если прицеп отвечает установленным техническим требованиям.$t$, $t$Ребёнка можно везти в велосипедном прицепе, если водитель совершеннолетний и соблюдены правила безопасной перевозки: ребёнок не должен выпасть, а велосипед — потерять устойчивость. Технические характеристики прицепов определит отдельный приказ, до его выхода пользоваться прицепами разрешено. Вне населённых пунктов — только днём и при хорошей видимости.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '043'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Չափահաս հեծանվորդը բնակավայրի փողոցով երեխա է տեղափոխում հեծանվին ամրացված կցորդով։ Թույլատրվո՞ւմ է արդյոք դա։$t$, $t$Ոչ, հեծանվի կցորդներով մարդկանց տեղափոխել չի կարելի։$t$, $t$Այո, առանց որևէ պայմանի։$t$, $t$Այո, եթե կցորդը համապատասխանում է սահմանված տեխնիկական պահանջներին։$t$, $t$Երեխային կարելի է տեղափոխել հեծանվի կցորդով, եթե վարորդը չափահաս է և պահպանված են անվտանգ փոխադրման կանոնները. երեխան չպետք է ընկնի, իսկ հեծանիվը չպետք է կորցնի կայունությունը։ Կցորդների տեխնիկական բնութագրերը կսահմանվեն առանձին հրամանով, իսկ մինչև դրա ընդունումը կցորդներից օգտվելը թույլատրվում է։ Բնակավայրերից դուրս՝ միայն ցերեկը և լավ տեսանելիության պայմաններում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '043'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'maniobras', 'own', 'rd518-2026', '044', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '044');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un turismo con remolque circula por un carril VAO, aunque su uso está prohibido para este conjunto. ¿Cómo se califica esta infracción?$t$, $t$Como grave, por incumplir las normas de utilización del carril VAO.$t$, $t$Como muy grave, por utilizar indebidamente un carril reservado.$t$, $t$Como leve, si no obstaculiza la circulación de otros vehículos.$t$, $t$Los carriles VAO se reservan a vehículos de alta ocupación, y un turismo con remolque es un conjunto al que se le prohíbe usarlos. Incumplir las normas de uso de estos carriles es una infracción grave. Que no estorbe a otros vehículos no cambia su calificación.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '044'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A passenger car towing a trailer is driving in an HOV lane, although this vehicle combination is prohibited from using it. How is this offence classified?$t$, $t$Serious, for breaching the rules on using the HOV lane.$t$, $t$Very serious, for improperly using a reserved lane.$t$, $t$Minor, if it does not obstruct other vehicles.$t$, $t$HOV lanes are reserved for high-occupancy vehicles, and a car with a trailer is a combination barred from using them. Breaking the rules on using these lanes is a serious offence. Not obstructing other vehicles does not change the classification.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '044'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Легковой автомобиль с прицепом едет по полосе VAO, хотя такому составу это запрещено. Как квалифицируется нарушение?$t$, $t$Как серьёзное (grave): нарушены правила пользования полосой VAO.$t$, $t$Как очень серьёзное (muy grave): незаконное использование выделенной полосы.$t$, $t$Как лёгкое, если оно не мешает движению других машин.$t$, $t$Полосы VAO предназначены для транспорта с высокой загрузкой, а легковой автомобиль с прицепом — состав, которому ими пользоваться запрещено. Нарушение правил пользования такими полосами считается серьёзным (grave). То, что оно не мешает другим, квалификацию не меняет.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '044'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Կցորդով մարդատար ավտոմեքենան երթևեկում է VAO գոտիով (բարձր զբաղվածությամբ ավտոմեքենաների համար), թեև տրանսպորտային միջոցների նման կազմին դա արգելված է։ Ինչպե՞ս է որակվում խախտումը։$t$, $t$Որպես լուրջ (grave). խախտվել են VAO գոտուց օգտվելու կանոնները։$t$, $t$Որպես շատ լուրջ (muy grave). հատուկ հատկացված գոտու ապօրինի օգտագործում։$t$, $t$Որպես թեթև, եթե այն չի խանգարում այլ ավտոմեքենաների երթևեկությանը։$t$, $t$VAO գոտիները նախատեսված են բարձր զբաղվածությամբ տրանսպորտային միջոցների համար, իսկ կցորդով մարդատար ավտոմեքենան այնպիսի կազմ է, որին արգելված է դրանցից օգտվել։ Նման գոտիներից օգտվելու կանոնների խախտումը համարվում է լուրջ (grave)։ Այն, որ խախտումը չի խանգարում ուրիշներին, որակումը չի փոխում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '044'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q45.png', 'mecanica', 'own', 'rd518-2026', '045', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '045');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Dos conductores de ciclomotores circulan en paralelo por un arcén transitable y suficientemente ancho. ¿Está permitido?$t$, $t$Sí, si circulan sin invadir la calzada.$t$, $t$No, deben circular uno detrás de otro.$t$, $t$Sí, si circulan sin dificultar el tráfico.$t$, $t$Los ciclomotores deben ir por el arcén en fila de uno, aunque este sea transitable y ancho. Circular en paralelo está prohibido para ellos. La marcha en columna de a dos es una posibilidad de los ciclistas, no de los ciclomotores.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '045'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Two moped riders are riding in parallel on a passable and sufficiently wide hard shoulder. Is this permitted?$t$, $t$Yes, if they stay off the carriageway.$t$, $t$No, they must ride one behind the other.$t$, $t$Yes, if they do not hinder traffic.$t$, $t$Mopeds must ride in single file on the hard shoulder, even when it is passable and wide. Riding abreast is prohibited for them. Riding two abreast is an option open to cyclists, not to mopeds.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '045'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Два водителя мопедов едут рядом по достаточно широкой и пригодной для движения обочине. Разрешено ли это?$t$, $t$Да, если они не выезжают на проезжую часть.$t$, $t$Нет, они должны ехать друг за другом.$t$, $t$Да, если не мешают движению.$t$, $t$Мопеды по обочине обязаны ехать в один ряд, даже если она широкая и проезжая. Ехать рядом им запрещено. Колонной по двое могут ехать велосипедисты, но не мопеды.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '045'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոպեդների երկու վարորդ կողք կողքի երթևեկում են բավականաչափ լայն և երթևեկության համար պիտանի երթևեկելի եզրագոտիով։ Թույլատրվո՞ւմ է արդյոք դա։$t$, $t$Այո, եթե նրանք դուրս չեն գալիս երթևեկելի մաս։$t$, $t$Ոչ, նրանք պետք է երթևեկեն մեկը մյուսի հետևից։$t$, $t$Այո, եթե չեն խանգարում երթևեկությանը։$t$, $t$Մոպեդները երթևեկելի եզրագոտիով պարտավոր են երթևեկել մեկ շարքով, նույնիսկ եթե այն լայն է և երթևեկության համար պիտանի։ Կողք կողքի երթևեկելը նրանց արգելված է։ Երկուական շարասյունով կարող են երթևեկել հեծանվորդները, բայց ոչ մոպեդները։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '045'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '046', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '046');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un peatón quiere cruzar la calzada de una glorieta por un paso para peatones habilitado en ella. ¿Puede hacerlo?$t$, $t$No, las plazas y glorietas deben rodearse en todo caso.$t$, $t$Sí, por cualquier punto, si no se aproximan vehículos.$t$, $t$Sí, por el paso para peatones habilitado.$t$, $t$Una plaza o glorieta se rodea por su borde, salvo que tenga un paso para peatones habilitado: entonces se cruza la calzada por él. Que no vengan vehículos no autoriza a cruzar por cualquier otro punto.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '046'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A pedestrian wants to cross the carriageway of a roundabout via a designated pedestrian crossing on it. May the pedestrian do so?$t$, $t$No, squares and roundabouts must always be walked around.$t$, $t$Yes, at any point, if no vehicles are approaching.$t$, $t$Yes, on the designated pedestrian crossing.$t$, $t$A square or roundabout is walked around its edge, unless it has a designated pedestrian crossing, in which case the carriageway is crossed there. An empty road does not allow crossing at any other point.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '046'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Пешеход хочет пересечь проезжую часть кольцевого перекрёстка по оборудованному на нём пешеходному переходу. Можно ли?$t$, $t$Нет, площади и кольцевые перекрёстки в любом случае нужно обходить.$t$, $t$Да, в любом месте, если не приближаются машины.$t$, $t$Да, по оборудованному пешеходному переходу.$t$, $t$Площадь или кольцо обходят по краю, но если на них есть оборудованный пешеходный переход, проезжую часть переходят по нему. То, что машин не видно, не даёт права пересекать её в другом месте.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '046'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հետիոտնը ցանկանում է հատել շրջանաձև խաչմերուկի երթևեկելի մասը դրա վրա կահավորված հետիոտնային անցումով։ Կարելի՞ է արդյոք։$t$, $t$Ոչ, հրապարակները և շրջանաձև խաչմերուկները ցանկացած դեպքում պետք է շրջանցել։$t$, $t$Այո, ցանկացած տեղով, եթե ավտոմեքենաներ չեն մոտենում։$t$, $t$Այո, կահավորված հետիոտնային անցումով։$t$, $t$Հրապարակը կամ շրջանաձև խաչմերուկը շրջանցում են եզրով, սակայն եթե դրանց վրա կա կահավորված հետիոտնային անցում, երթևեկելի մասը հատում են դրանով։ Այն, որ ավտոմեքենաներ չեն երևում, իրավունք չի տալիս այն հատելու այլ տեղով։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '046'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'primeros-auxilios', 'own', 'rd518-2026', '047', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '047');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un vehículo de auxilio en vías públicas utiliza el arcén para acudir a un servicio urgente y lleva las señales que le corresponden. ¿A qué velocidad máxima puede circular?$t$, $t$A 20 kilómetros por hora.$t$, $t$A 30 kilómetros por hora.$t$, $t$A 50 kilómetros por hora.$t$, $t$Un vehículo de auxilio en carretera puede usar el arcén para llegar a una urgencia, con sus señales luminosas puestas, y en ese caso su velocidad máxima es de 30 km/h.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '047'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A roadside assistance vehicle uses the hard shoulder to attend an urgent call and displays the required signals. What is the maximum speed at which it may travel?$t$, $t$20 km/h.$t$, $t$30 km/h.$t$, $t$50 km/h.$t$, $t$A roadside assistance vehicle may use the hard shoulder to reach an emergency, with its warning signals on, and in that case its maximum speed is 30 km/h.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '047'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Автомобиль дорожной помощи едет по обочине на срочный вызов с положенными ему сигналами. С какой максимальной скоростью он может двигаться?$t$, $t$20 км/ч.$t$, $t$30 км/ч.$t$, $t$50 км/ч.$t$, $t$Машина дорожной помощи вправе использовать обочину, чтобы добраться до места срочного вызова, с включёнными сигналами. Максимальная скорость при этом — 30 км/ч.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '047'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ճանապարհային օգնության ավտոմեքենան իրեն վերապահված ազդանշաններով երթևեկելի եզրագոտիով գնում է շտապ կանչի։ Առավելագույնը ի՞նչ արագությամբ կարող է այն շարժվել։$t$, $t$20 km/h։$t$, $t$30 km/h։$t$, $t$50 km/h։$t$, $t$Ճանապարհային օգնության ավտոմեքենան իրավունք ունի միացված ազդանշաններով օգտվելու երթևեկելի եզրագոտուց՝ շտապ կանչի վայր հասնելու համար։ Առավելագույն արագությունն այդ դեպքում 30 km/h է։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '047'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '048', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '048');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un sanitario atiende a un paciente en el habitáculo de una ambulancia asistencial que circula en servicio de urgencia por una autovía. ¿Debe llevar puesto el cinturón de seguridad?$t$, $t$No, está exento en todo tipo de vías mientras presta asistencia en ruta.$t$, $t$Sí, la exención de los servicios de urgencia solo rige en poblado.$t$, $t$Sí, salvo que la ambulancia circule a menos de 50 km/h.$t$, $t$El sanitario que atiende a un paciente en una ambulancia asistencial durante un servicio urgente queda exento del cinturón en cualquier tipo de vía, porque su trabajo lo requiere en el habitáculo. La velocidad del vehículo no influye. El conductor de la ambulancia, en cambio, debe ir abrochado fuera de poblado.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '048'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A paramedic is treating a patient in the compartment of an emergency ambulance travelling on a dual carriageway on an urgent call. Must the paramedic wear a seat belt?$t$, $t$No, they are exempt on all types of road while giving care en route.$t$, $t$Yes, the emergency-services exemption applies only in built-up areas.$t$, $t$Yes, unless the ambulance is travelling below 50 km/h.$t$, $t$A paramedic treating a patient in an ambulance on an urgent call is exempt from the seat belt on any type of road, because the work requires moving around the compartment. The vehicle's speed makes no difference. The ambulance driver, by contrast, must be belted outside built-up areas.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '048'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Медработник оказывает помощь пациенту в салоне машины скорой помощи, которая едет по скоростной дороге на срочный вызов. Должен ли он быть пристёгнут?$t$, $t$Нет, пока он оказывает помощь в пути, освобождение действует на дорогах любого типа.$t$, $t$Да, освобождение для экстренных служб действует только в населённом пункте.$t$, $t$Да, если скорая не едет медленнее 50 км/ч.$t$, $t$Медработник, оказывающий помощь пациенту в машине скорой при срочном вызове, освобождён от ремня на дорогах любого типа, потому что работа требует передвигаться по салону. Скорость машины значения не имеет. Водитель же скорой вне населённых пунктов обязан быть пристёгнут.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '048'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Բուժաշխատողը հիվանդին օգնություն է ցուցաբերում շտապ օգնության ավտոմեքենայի սրահում, որը արագընթաց ճանապարհով (autovía) գնում է շտապ կանչի։ Պարտավո՞ր է արդյոք նա ամրակապված լինել անվտանգության գոտիով։$t$, $t$Ոչ, քանի դեռ նա ճանապարհին օգնություն է ցուցաբերում, ազատումը գործում է ցանկացած տիպի ճանապարհներին։$t$, $t$Այո, արտակարգ ծառայությունների համար ազատումը գործում է միայն բնակավայրում։$t$, $t$Այո, եթե շտապ օգնության ավտոմեքենան 50 km/h-ից դանդաղ չի երթևեկում։$t$, $t$Շտապ կանչի ժամանակ շտապ օգնության ավտոմեքենայում հիվանդին օգնություն ցուցաբերող բուժաշխատողն ազատված է անվտանգության գոտուց ցանկացած տիպի ճանապարհներին, որովհետև աշխատանքը պահանջում է տեղաշարժվել սրահում։ Ավտոմեքենայի արագությունը նշանակություն չունի։ Իսկ շտապ օգնության ավտոմեքենայի վարորդը բնակավայրերից դուրս պարտավոր է ամրակապված լինել։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '048'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'velocidad', 'own', 'rd518-2026', '049', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '049');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un autobús transporta pasajeros de pie por una autopista, estando autorizado para ello. ¿Cuál es su velocidad máxima?$t$, $t$80 kilómetros por hora.$t$, $t$90 kilómetros por hora.$t$, $t$100 kilómetros por hora.$t$, $t$Cuando un autobús lleva pasajeros de pie, su límite en cualquier vía fuera de poblado, autopistas incluidas, es de 80 km/h. Lo mismo ocurre si carece de cinturones. Con todos los pasajeros sentados y cinturones, el límite es 100 km/h en autopista y autovía y 90 km/h en carretera convencional.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '049'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A bus is carrying standing passengers on a motorway and is authorised to do so. What is its maximum speed?$t$, $t$80 km/h.$t$, $t$90 km/h.$t$, $t$100 km/h.$t$, $t$When a bus carries standing passengers, its limit on any road outside built-up areas, motorways included, is 80 km/h. The same applies if it has no seat belts. With all passengers seated and belted, the limit is 100 km/h on motorways and dual carriageways and 90 km/h on conventional roads.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '049'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Автобус везёт стоящих пассажиров по автомагистрали, и это ему разрешено. Какова его максимальная скорость?$t$, $t$80 км/ч.$t$, $t$90 км/ч.$t$, $t$100 км/ч.$t$, $t$Если автобус перевозит стоящих пассажиров, на любой дороге вне населённых пунктов, включая автомагистрали, предел — 80 км/ч. Тот же предел у автобуса без ремней безопасности. Если все сидят пристёгнутыми, предел — 100 км/ч на автомагистралях и скоростных дорогах и 90 км/ч на обычных загородных.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '049'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ավտոբուսը ավտոմագիստրալով (autopista) կանգնած ուղևորներ է տեղափոխում, և դա նրան թույլատրված է։ Որքա՞ն է նրա առավելագույն արագությունը։$t$, $t$80 km/h։$t$, $t$90 km/h։$t$, $t$100 km/h։$t$, $t$Եթե ավտոբուսը կանգնած ուղևորներ է տեղափոխում, բնակավայրերից դուրս ցանկացած ճանապարհի, այդ թվում՝ ավտոմագիստրալների (autopista) վրա սահմանը 80 km/h է։ Նույն սահմանն է գործում անվտանգության գոտիներ չունեցող ավտոբուսի համար։ Եթե բոլորը նստած են և ամրակապված, սահմանը 100 km/h է ավտոմագիստրալներում (autopista) և արագընթաց ճանապարհներին (autovía) և 90 km/h՝ բնակավայրերից դուրս գտնվող սովորական ճանապարհներին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '049'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '050', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '050');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En un tramo donde está habilitada y señalizada la circulación de motocicletas por el arcén, los vehículos avanzan muy despacio por una retención. ¿Puede una motocicleta circular por el arcén derecho?$t$, $t$Sí, siempre que no supere los 30 km/h.$t$, $t$Sí, siempre que extreme la precaución.$t$, $t$No, porque los vehículos de los carriles todavía avanzan.$t$, $t$Incluso en un tramo habilitado, la moto solo puede usar el arcén derecho cuando el tráfico de los carriles está completamente detenido. Si los coches aún avanzan, aunque sea despacio, la moto debe quedarse en su carril. Una vez parados, irá por el arcén en fila de uno, a un máximo de 30 km/h.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '050'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a section where motorcycles are authorised and signposted to use the hard shoulder, vehicles are moving very slowly because of congestion. May a motorcycle travel along the right-hand hard shoulder?$t$, $t$Yes, provided it does not exceed 30 km/h.$t$, $t$Yes, provided it takes particular care.$t$, $t$No, because the vehicles in the traffic lanes are still moving.$t$, $t$Even on an authorised section, a motorcycle may use the right-hand shoulder only when the traffic in the lanes has come to a complete stop. If cars are still creeping forward, the motorcycle must stay in its lane. Once traffic is stopped it rides along the shoulder in single file at no more than 30 km/h.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '050'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На участке, где езда мотоциклов по обочине разрешена и обозначена, машины из-за затора еле ползут. Может ли мотоцикл ехать по правой обочине?$t$, $t$Да, если не превышает 30 км/ч.$t$, $t$Да, если проявляет особую осторожность.$t$, $t$Нет, потому что машины в полосах ещё движутся.$t$, $t$Даже на разрешённом участке мотоцикл может выехать на правую обочину только при полностью остановившемся потоке. Если машины хоть медленно, но продвигаются, мотоцикл остаётся в своей полосе. Когда поток встал, по обочине едут по одному, не быстрее 30 км/ч.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '050'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Այն հատվածում, որտեղ մոտոցիկլների երթևեկությունը երթևեկելի եզրագոտիով թույլատրված և նշված է, խցանման պատճառով ավտոմեքենաները հազիվ են առաջ շարժվում։ Կարո՞ղ է մոտոցիկլը երթևեկել աջ երթևեկելի եզրագոտիով։$t$, $t$Այո, եթե չի գերազանցում 30 km/h-ը։$t$, $t$Այո, եթե հատուկ զգուշություն է ցուցաբերում։$t$, $t$Ոչ, որովհետև գոտիներում ավտոմեքենաները դեռ շարժվում են։$t$, $t$Նույնիսկ թույլատրված հատվածում մոտոցիկլը կարող է դուրս գալ աջ երթևեկելի եզրագոտի միայն այն դեպքում, երբ հոսքն ամբողջությամբ կանգ է առել։ Եթե ավտոմեքենաները թեկուզ դանդաղ, բայց առաջ են շարժվում, մոտոցիկլը մնում է իր գոտում։ Երբ հոսքը կանգ է առել, երթևեկելի եզրագոտիով երթևեկում են մեկ շարքով՝ 30 km/h-ից ոչ արագ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '050'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q51.png', 'mecanica', 'own', 'rd518-2026', '051', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '051');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$El conductor de un ciclomotor va a girar a la derecha para entrar en otra vía y hay un ciclista en sus proximidades. ¿Debe cederle el paso?$t$, $t$No, porque el ciclomotor no es un vehículo de motor.$t$, $t$Sí, porque el ciclista tiene prioridad en esta situación.$t$, $t$No, si ha señalizado el giro con suficiente antelación.$t$, $t$Al girar para entrar en otra vía, el conductor de un ciclomotor debe ceder el paso al ciclista que esté cerca, que tiene prioridad. Los ciclomotores no quedan fuera de esta regla, y avisar el giro con antelación no da preferencia. Si hace falta, se detiene y lo deja pasar.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '051'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$The rider of a moped is going to turn right to enter another road, and a cyclist is nearby. Must the moped rider give way to the cyclist?$t$, $t$No, because a moped is not a motor vehicle.$t$, $t$Yes, because the cyclist has priority in this situation.$t$, $t$No, if the turn was signalled well in advance.$t$, $t$When turning to enter another road, a moped rider must give way to a cyclist nearby, who has priority. Mopeds are not outside this rule, and signalling the turn early gives no right of way. If necessary, the rider stops and lets the cyclist through.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '051'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Водитель мопеда собирается повернуть направо, чтобы въехать на другую дорогу, а рядом едет велосипедист. Должен ли он уступить дорогу?$t$, $t$Нет, потому что мопед не является механическим транспортным средством.$t$, $t$Да, потому что в этой ситуации у велосипедиста приоритет.$t$, $t$Нет, если он заблаговременно показал поворот.$t$, $t$При повороте на другую дорогу водитель мопеда должен уступить велосипедисту, находящемуся рядом: приоритет у него. Мопеды под это правило подпадают, а ранний сигнал поворота преимущества не даёт. Если нужно, мопед останавливается и пропускает велосипедиста.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '051'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոպեդի վարորդը պատրաստվում է աջ թեքվել՝ այլ ճանապարհ մտնելու համար, իսկ մոտակայքում հեծանվորդ է երթևեկում։ Պարտավո՞ր է արդյոք նա զիջել ճանապարհը։$t$, $t$Ոչ, որովհետև մոպեդը մեխանիկական տրանսպորտային միջոց չէ։$t$, $t$Այո, որովհետև այս իրավիճակում առաջնահերթությունը հեծանվորդինն է։$t$, $t$Ոչ, եթե նա ժամանակին նախապես տվել է թեքվելու ազդանշանը։$t$, $t$Այլ ճանապարհ թեքվելիս մոպեդի վարորդը պետք է ճանապարհը զիջի մոտակայքում գտնվող հեծանվորդին. առաջնահերթությունը նրանն է։ Մոպեդների վրա այս կանոնը տարածվում է, իսկ թեքվելու վաղ տրված ազդանշանը առավելություն չի տալիս։ Անհրաժեշտության դեպքում մոպեդը կանգ է առնում և բաց թողնում հեծանվորդին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '051'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', '/new-rules/q52.png', 'autopista-autovia', 'own', 'rd518-2026', '052', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '052');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una autovía de dos carriles por sentido, una retención hace que los vehículos circulen a paso de peatón. Al aproximarse un vehículo prioritario con las señales especiales activadas, ¿cómo deben apartarse los demás vehículos?$t$, $t$Todos hacia la derecha, dejando libre el carril situado más a la izquierda.$t$, $t$Los del carril izquierdo a la izquierda y los del carril derecho a la derecha.$t$, $t$Todos hacia la izquierda, dejando libre el carril situado más a la derecha.$t$, $t$Con dos carriles por sentido, el pasillo debe quedar entre ambas filas. Para ello el carril izquierdo se arrima al borde izquierdo y el derecho, al derecho. Si todos fueran hacia el mismo lado, no habría hueco en el centro por donde pasar.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '052'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a dual carriageway with two lanes in each direction, traffic is moving at walking pace because of congestion. As a priority vehicle approaches with its special signals on, how must the other vehicles move aside?$t$, $t$All move to the right, leaving the leftmost lane clear.$t$, $t$Those in the left lane move to the left and those in the right lane move to the right.$t$, $t$All move to the left, leaving the rightmost lane clear.$t$, $t$With two lanes in each direction the corridor must open between the two rows. The left lane hugs the left edge and the right lane hugs the right edge. If everyone moved to the same side, no gap would open in the middle for the priority vehicle.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '052'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На скоростной дороге с двумя полосами в каждом направлении из-за затора машины движутся со скоростью пешехода. Приближается транспорт с приоритетом с включёнными спецсигналами. Как должны сместиться остальные?$t$, $t$Все вправо, освободив крайнюю левую полосу.$t$, $t$Машины левой полосы влево, правой — вправо.$t$, $t$Все влево, освободив крайнюю правую полосу.$t$, $t$При двух полосах в направлении коридор должен пройти между рядами. Левый ряд прижимается к левому краю, правый — к правому. Если все уйдут в одну сторону, посередине для проезда спецтранспорта места не останется.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '052'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Յուրաքանչյուր ուղղությամբ երկու գոտի ունեցող արագընթաց ճանապարհին (autovía) խցանման պատճառով ավտոմեքենաները շարժվում են հետիոտնի արագությամբ։ Մոտենում է առաջնահերթ տրանսպորտային միջոց՝ միացված հատուկ ազդանշաններով։ Ինչպե՞ս պետք է տեղաշարժվեն մյուսները։$t$, $t$Բոլորը դեպի աջ՝ ազատելով ծայրի ձախ գոտին։$t$, $t$Ձախ գոտու ավտոմեքենաները՝ դեպի ձախ, աջ գոտունը՝ դեպի աջ։$t$, $t$Բոլորը դեպի ձախ՝ ազատելով ծայրի աջ գոտին։$t$, $t$Մեկ ուղղությամբ երկու գոտու դեպքում արտակարգ միջանցքը պետք է անցնի շարքերի միջև։ Ձախ շարքը սեղմվում է ձախ եզրին, աջը՝ աջ եզրին։ Եթե բոլորը գնան մի կողմ, մեջտեղում հատուկ տրանսպորտի անցման համար տեղ չի մնա։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '052'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'adelantamiento', 'own', 'rd518-2026', '053', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '053');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En los pasos para peatones y en sus proximidades, ¿está permitido adelantar?$t$, $t$No, en ningún caso.$t$, $t$Sí, a velocidad reducida, para poder detenerse si surge peligro de atropello.$t$, $t$Sí, siempre que no haya peatones cruzando la calzada.$t$, $t$Está prohibido adelantar en los pasos para peatones señalizados y junto a ellos, sin excepciones. Reducir la velocidad o que no haya peatones en ese momento no levanta la prohibición. La misma norma la aplica a los cruces con vías ciclistas y a los pasos a nivel, también para dos ruedas.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '053'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$At pedestrian crossings and in their vicinity, is overtaking permitted?$t$, $t$No, under no circumstances.$t$, $t$Yes, at reduced speed, so as to be able to stop if there is a risk of hitting someone.$t$, $t$Yes, provided no pedestrians are crossing the carriageway.$t$, $t$Overtaking is prohibited at marked pedestrian crossings and next to them, with no exceptions. Slowing down, or the absence of pedestrians at that moment, does not lift the ban. The same rule applies at cycle-track crossings and level crossings, and also when overtaking two-wheelers.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '053'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Разрешён ли обгон на пешеходных переходах и рядом с ними?$t$, $t$Нет, ни при каких условиях.$t$, $t$Да, на малой скорости, чтобы успеть остановиться, если возникнет опасность наезда.$t$, $t$Да, если в этот момент никто не переходит дорогу.$t$, $t$Обгон запрещён на обозначенных пешеходных переходах и рядом с ними без исключений. Малая скорость и отсутствие пешеходов в данный момент запрет не снимают. Та же норма действует на пересечениях с велодорожками и на железнодорожных переездах, в том числе при обгоне двухколёсного транспорта.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '053'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Թույլատրվո՞ւմ է արդյոք վազանցումը հետիոտնային անցումներում և դրանց մոտակայքում։$t$, $t$Ոչ, ոչ մի դեպքում։$t$, $t$Այո, ցածր արագությամբ, որպեսզի հնարավոր լինի կանգ առնել, եթե վրաերթի վտանգ առաջանա։$t$, $t$Այո, եթե այդ պահին ոչ ոք չի անցնում ճանապարհը։$t$, $t$Վազանցումն արգելված է նշված հետիոտնային անցումներում և դրանց մոտակայքում՝ առանց բացառությունների։ Ցածր արագությունը և տվյալ պահին հետիոտների բացակայությունը արգելքը չեն վերացնում։ Նույն նորմը գործում է հեծանվային ուղիների հետ հատումներում և երկաթուղային գծանցներում, այդ թվում՝ երկանիվ տրանսպորտային միջոցներին վազանցելիս։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '053'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '054', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '054');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista circula de noche por una vía interurbana y lleva en el brazo una banda reflectante conforme a la normativa de equipos de protección individual, visible a 150 metros. Respecto al elemento de visibilidad que debe usar, ¿cumple la norma?$t$, $t$No, además debe llevar puesta una prenda reflectante.$t$, $t$No, debe sustituir la banda por un elemento luminoso.$t$, $t$Sí, esa banda puede ser el elemento reflectante exigido.$t$, $t$De noche o con visibilidad muy reducida, el ciclista fuera de poblado debe llevar una prenda reflectante o un elemento reflectante independiente que cumpla la norma de protección individual y se vea desde 150 m. Una banda en el brazo sirve si cumple ambos requisitos. No sustituye al alumbrado de la bicicleta, que se regula aparte.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '054'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A cyclist is riding at night on a road outside a built-up area and wears a reflective band on one arm that complies with personal protective equipment rules and is visible from 150 metres. As regards the visibility element the cyclist must use, is the cyclist complying with the rule?$t$, $t$No, the cyclist must also wear a reflective garment.$t$, $t$No, the cyclist must replace the band with a luminous element.$t$, $t$Yes, that band can serve as the required reflective element.$t$, $t$At night or in very poor visibility, a cyclist outside built-up areas must wear a reflective garment or a separate reflective element that meets the personal-protection standard and is visible from 150 m. An arm band does the job if it meets both requirements. It does not replace the bicycle's own lighting, which is regulated separately.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '054'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Велосипедист едет ночью по загородной дороге; на руке у него светоотражающая повязка, соответствующая нормам средств индивидуальной защиты и видимая со 150 м. Выполняет ли он требование к элементу видимости?$t$, $t$Нет, он должен дополнительно надеть светоотражающую одежду.$t$, $t$Нет, повязку нужно заменить светящимся элементом.$t$, $t$Да, такая повязка может служить требуемым светоотражающим элементом.$t$, $t$Ночью или при очень плохой видимости велосипедист за городом должен носить светоотражающую одежду либо отдельный светоотражающий элемент, отвечающий нормам средств защиты и видимый со 150 м. Повязка на руке подходит, если выполнены оба условия. Освещение самого велосипеда она не заменяет, оно регулируется отдельно.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '054'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հեծանվորդը գիշերը երթևեկում է բնակավայրից դուրս գտնվող ճանապարհով. նրա թևին կա լուսաանդրադարձող թևկապ, որը համապատասխանում է անհատական պաշտպանության միջոցների նորմերին և տեսանելի է 150 m հեռավորությունից։ Կատարո՞ւմ է արդյոք նա տեսանելիության տարրին ներկայացվող պահանջը։$t$, $t$Ոչ, նա պետք է լրացուցիչ հագնի լուսաանդրադարձող հագուստ։$t$, $t$Ոչ, թևկապը պետք է փոխարինել լուսարձակող տարրով։$t$, $t$Այո, այդպիսի թևկապը կարող է ծառայել որպես պահանջվող լուսաանդրադարձող տարր։$t$, $t$Գիշերը կամ շատ վատ տեսանելիության պայմաններում հեծանվորդը բնակավայրից դուրս պետք է կրի լուսաանդրադարձող հագուստ կամ առանձին լուսաանդրադարձող տարր, որը համապատասխանում է պաշտպանության միջոցների նորմերին և տեսանելի է 150 m հեռավորությունից։ Թևկապը հարմար է, եթե կատարված են երկու պայմաններն էլ։ Այն չի փոխարինում բուն հեծանվի լուսավորությանը, որը կարգավորվում է առանձին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '054'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '055', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '055');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un conductor de motocicleta dispone de un certificado de exención por razones médicas graves. ¿Puede circular sin casco?$t$, $t$Sí, mientras el certificado sea válido, en cualquier tipo de vía.$t$, $t$No, debe utilizar un casco homologado y debidamente abrochado.$t$, $t$Sí, pero únicamente cuando circule por vías urbanas y travesías.$t$, $t$Hasta el 30 de septiembre de 2026 un certificado médico permitía ir sin casco durante su vigencia. Esa exención ha desaparecido: el motorista debe llevar casco homologado o certificado y bien abrochado en cualquier vía, también en ciudad.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '055'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A motorcycle rider has a certificate of exemption for serious medical reasons. May they ride without a helmet?$t$, $t$Yes, while the certificate is valid, on any type of road.$t$, $t$No, the rider must wear an approved and properly fastened helmet.$t$, $t$Yes, but only on urban roads and road sections through built-up areas.$t$, $t$Until 30 September 2026 a medical certificate allowed riding without a helmet while it was valid. That exemption is gone: the rider must wear an approved or certified, properly fastened helmet on every road, in town too.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '055'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$У мотоциклиста есть справка об освобождении по серьёзным медицинским причинам. Может ли он ехать без шлема?$t$, $t$Да, пока справка действует, на дороге любого типа.$t$, $t$Нет, он должен надеть сертифицированный и правильно застёгнутый шлем.$t$, $t$Да, но только на городских улицах и на участках шоссе внутри населённых пунктов.$t$, $t$До 30 сентября 2026 года медицинская справка позволяла ездить без шлема, пока она действует. Это освобождение отменено: мотоциклист обязан носить сертифицированный шлем, правильно застёгнутый, на любой дороге, в том числе в городе.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '055'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոտոցիկլավարն ունի լուրջ բժշկական պատճառներով ազատման տեղեկանք։ Կարո՞ղ է նա երթևեկել առանց սաղավարտի։$t$, $t$Այո, քանի դեռ տեղեկանքն ուժի մեջ է, ցանկացած տիպի ճանապարհով։$t$, $t$Ոչ, նա պետք է կրի հավաստագրված և ճիշտ ամրացված սաղավարտ։$t$, $t$Այո, բայց միայն քաղաքային փողոցներում և մայրուղիների՝ բնակավայրերի ներսում գտնվող հատվածներում։$t$, $t$Մինչև 2026 թվականի սեպտեմբերի 30-ը բժշկական տեղեկանքը թույլ էր տալիս երթևեկել առանց սաղավարտի, քանի դեռ այն ուժի մեջ էր։ Այս ազատումը վերացվել է. մոտոցիկլավարը պարտավոր է կրել հավաստագրված, ճիշտ ամրացված սաղավարտ ցանկացած ճանապարհին, այդ թվում՝ քաղաքում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '055'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '056', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '056');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una persona empuja un patinete eléctrico averiado por el arcén. ¿Por qué lado debe circular?$t$, $t$Por el lado derecho, en el sentido de su marcha.$t$, $t$Por el lado izquierdo, en el sentido de su marcha.$t$, $t$Por cualquiera de los dos lados, indistintamente.$t$, $t$Quien empuja un VMP, igual que quien lleva una bicicleta o un ciclomotor de dos ruedas, debe ir por el lado derecho en el sentido de su marcha. Es una excepción a la regla general de los peatones, que van por la izquierda cuando no hay acera.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '056'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A person is pushing a broken-down electric scooter along the hard shoulder. Which side must they use?$t$, $t$The right-hand side, in the direction they are walking.$t$, $t$The left-hand side, in the direction they are walking.$t$, $t$Either side, without distinction.$t$, $t$A person pushing a PMV, like someone leading a bicycle or a two-wheeled moped, must keep to the right-hand side in the direction of travel. This is an exception to the general rule for pedestrians, who walk on the left when there is no pavement.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '056'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Человек ведёт по обочине неисправный электросамокат. По какой стороне он должен идти?$t$, $t$По правой, по ходу своего движения.$t$, $t$По левой, по ходу своего движения.$t$, $t$По любой, без разницы.$t$, $t$Тот, кто ведёт СИМ, как и те, кто ведёт велосипед или двухколёсный мопед, идёт по правой стороне по ходу движения. Это исключение из общего правила для пешеходов, которые идут слева, когда тротуара нет.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '056'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մարդը երթևեկելի եզրագոտիով ձեռքով տանում է անսարք էլեկտրական սկուտեր։ Ո՞ր կողմով նա պետք է քայլի։$t$, $t$Աջ կողմով՝ իր շարժման ուղղությամբ։$t$, $t$Ձախ կողմով՝ իր շարժման ուղղությամբ։$t$, $t$Ցանկացած կողմով, տարբերություն չկա։$t$, $t$Նա, ով ձեռքով տանում է անհատական շարժունակության միջոց (ԱՇՄ), ինչպես և նրանք, ովքեր տանում են հեծանիվ կամ երկանիվ մոպեդ, քայլում է աջ կողմով՝ շարժման ուղղությամբ։ Սա բացառություն է հետիոտների համար սահմանված ընդհանուր կանոնից, ըստ որի նրանք քայլում են ձախ կողմով, երբ մայթ չկա։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '056'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '057', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '057');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una calle de poblado sin acera ni zona peatonal practicable, ¿por qué lado debe caminar un peatón?$t$, $t$Por la derecha o por la izquierda, según las circunstancias del tráfico.$t$, $t$Siempre por la derecha, en el sentido de su marcha.$t$, $t$Por la izquierda, salvo que razones de seguridad justifiquen ir por la derecha.$t$, $t$Si no hay acera ni zona peatonal utilizable, el peatón camina por el lado izquierdo, también en poblado: así ve venir los vehículos de frente. Solo va por la derecha como excepción, cuando la izquierda es más peligrosa. Por la derecha deben ir siempre quienes llevan bicicleta o VMP y los grupos dirigidos por una persona.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '057'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a street in a built-up area with no pavement or usable pedestrian area, on which side must a pedestrian walk?$t$, $t$On the right or the left, depending on traffic conditions.$t$, $t$Always on the right, in the direction of travel.$t$, $t$On the left, unless safety reasons justify walking on the right.$t$, $t$With no pavement or usable pedestrian area, a pedestrian walks on the left-hand side, in towns too: that way they see vehicles coming towards them. Walking on the right is only an exception, when the left is more dangerous. People leading a bicycle or PMV and groups led by one person always keep right.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '057'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На улице в населённом пункте нет ни тротуара, ни пригодной пешеходной зоны. По какой стороне должен идти пешеход?$t$, $t$По правой или по левой, в зависимости от дорожной обстановки.$t$, $t$Всегда по правой, по ходу движения.$t$, $t$По левой, кроме случаев, когда безопасность оправдывает движение по правой.$t$, $t$Если нет тротуара и пригодной пешеходной зоны, пешеход идёт по левой стороне, в том числе в населённом пункте: так он видит машины, едущие навстречу. По правой — только как исключение, когда слева опаснее. По правой стороне всегда идут те, кто ведёт велосипед или СИМ, и группы под руководством одного человека.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '057'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Բնակավայրի փողոցում չկա ո՛չ մայթ, ո՛չ էլ օգտագործման համար պիտանի հետիոտնային գոտի։ Ո՞ր կողմով պետք է քայլի հետիոտնը։$t$, $t$Աջ կամ ձախ կողմով՝ կախված երթևեկության իրավիճակից։$t$, $t$Միշտ աջ կողմով՝ իր շարժման ուղղությամբ։$t$, $t$Ձախ կողմով, բացառությամբ այն դեպքերի, երբ անվտանգության նկատառումներով արդարացված է աջ կողմով քայլելը։$t$, $t$Եթե չկա մայթ և պիտանի հետիոտնային գոտի, հետիոտնը քայլում է ձախ կողմով, այդ թվում՝ բնակավայրում. այդպես նա տեսնում է դիմացից եկող մեքենաները։ Աջ կողմով՝ միայն որպես բացառություն, երբ ձախ կողմն ավելի վտանգավոր է։ Աջ կողմով միշտ շարժվում են նրանք, ովքեր ձեռքով տանում են հեծանիվ կամ անհատական շարժունակության միջոց (ԱՇՄ), ինչպես նաև մեկ անձի ղեկավարությամբ շարժվող խմբերը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '057'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '058', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '058');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un grupo de peatones circula por el arcén de una carretera con buena visibilidad y poco tráfico. ¿Puede marchar en paralelo?$t$, $t$No, deben marchar unos detrás de otros.$t$, $t$Sí, porque hay buena visibilidad y poco tráfico.$t$, $t$Sí, siempre que no entorpezcan la circulación.$t$, $t$Los peatones que van por el arcén o la calzada lo hacen en fila de uno, sea cual sea la visibilidad o la intensidad del tráfico. Así ocupan menos espacio y dejan más margen a los vehículos. Además deben ir lo más cerca posible del borde exterior y no entorpecer la circulación.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '058'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A group of pedestrians is walking along the shoulder of a road in good visibility and light traffic. May they walk abreast?$t$, $t$No, they must walk one behind another.$t$, $t$Yes, because visibility is good and traffic is light.$t$, $t$Yes, provided they do not obstruct traffic.$t$, $t$Pedestrians who walk on the shoulder or carriageway do so in single file, whatever the visibility or traffic density. This way they take up less room and leave vehicles more margin. They must also keep as close to the outer edge as possible and not obstruct traffic.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '058'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Группа пешеходов идёт по обочине дороги при хорошей видимости и слабом движении. Можно ли им идти в несколько рядов?$t$, $t$Нет, они должны идти друг за другом.$t$, $t$Да, потому что видимость хорошая, а движение слабое.$t$, $t$Да, если они не мешают движению.$t$, $t$Пешеходы, идущие по обочине или проезжей части, двигаются в один ряд независимо от видимости и интенсивности движения. Так группа занимает меньше места и оставляет транспорту больше запаса. Кроме того, идти нужно как можно ближе к внешнему краю и не мешать движению.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '058'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հետիոտների խումբը քայլում է ճանապարհի երթևեկելի եզրագոտիով՝ լավ տեսանելիության և թույլ երթևեկության պայմաններում։ Կարո՞ղ են նրանք քայլել մի քանի շարքով։$t$, $t$Ոչ, նրանք պետք է քայլեն մեկը մյուսի հետևից։$t$, $t$Այո, քանի որ տեսանելիությունը լավ է, իսկ երթևեկությունը՝ թույլ։$t$, $t$Այո, եթե նրանք չեն խանգարում երթևեկությանը։$t$, $t$Երթևեկելի եզրագոտիով կամ երթևեկելի մասով քայլող հետիոտները շարժվում են մեկ շարքով՝ անկախ տեսանելիությունից և երթևեկության ինտենսիվությունից։ Այդպես խումբն ավելի քիչ տեղ է զբաղեցնում և տրանսպորտային միջոցներին ավելի մեծ տարածություն է թողնում։ Բացի այդ, պետք է քայլել արտաքին եզրին հնարավորինս մոտ և չխանգարել երթևեկությանը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '058'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'luces', 'own', 'rd518-2026', '059', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '059');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un grupo de amigos camina de noche por el arcén de una vía interurbana. ¿Debe llevar luces para indicar su situación y dimensiones?$t$, $t$Solo si el grupo está dirigido por una persona responsable.$t$, $t$Solo cuando el grupo forma un cortejo debidamente organizado.$t$, $t$Sí, aunque el grupo no esté dirigido por una persona.$t$, $t$De noche o con visibilidad muy reducida, fuera de poblado, todo grupo de peatones debe señalar con luces su posición y dimensiones, también un grupo de amigos sin nadie al mando. Las luces van en el lado más próximo al centro de la calzada: blanca o amarilla hacia delante y roja hacia atrás. Además, cada peatón debe llevar un elemento luminoso o reflectante visible desde 150 m.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '059'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A group of friends is walking at night along the hard shoulder of a road outside a built-up area. Must it carry lights to show its position and size?$t$, $t$Only if the group is led by a responsible person.$t$, $t$Only when the group forms a properly organised procession.$t$, $t$Yes, even if no one is leading the group.$t$, $t$At night or in very poor visibility outside built-up areas, every group of pedestrians must mark its position and size with lights, a group of friends with no leader included. The lights go on the side nearest the centre of the road: white or yellow facing forward and red facing back. In addition, each pedestrian needs a luminous or reflective element visible from 150 m.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '059'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Группа друзей идёт ночью по обочине загородной дороги. Обязана ли она обозначить своё положение и размеры фонарями?$t$, $t$Только если группу ведёт ответственный человек.$t$, $t$Только если группа идёт организованной процессией.$t$, $t$Да, даже если никто группой не руководит.$t$, $t$Ночью и при очень плохой видимости за городом любая группа пешеходов обязана обозначить свой габарит и положение фонарями, в том числе компания друзей без руководителя. Фонари ставят со стороны, ближайшей к центру проезжей части: белый или жёлтый вперёд, красный назад. Кроме того, у каждого пешехода должен быть светящийся или светоотражающий элемент, видимый со 150 м.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '059'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ընկերների խումբը գիշերը քայլում է բնակավայրից դուրս գտնվող ճանապարհի երթևեկելի եզրագոտիով։ Պարտավո՞ր է այն լույսերով նշել իր դիրքն ու չափերը։$t$, $t$Միայն եթե խումբը ղեկավարում է պատասխանատու անձ։$t$, $t$Միայն եթե խումբը շարժվում է կազմակերպված երթով։$t$, $t$Այո, նույնիսկ եթե խումբը ոչ ոք չի ղեկավարում։$t$, $t$Գիշերը և շատ վատ տեսանելիության պայմաններում, բնակավայրից դուրս, հետիոտների ցանկացած խումբ պարտավոր է լույսերով նշել իր չափերն ու դիրքը, այդ թվում՝ առանց ղեկավարի ընկերների խումբը։ Լույսերը տեղադրվում են երթևեկելի մասի կենտրոնին ամենամոտ կողմում՝ սպիտակ կամ դեղին՝ դեպի առաջ, կարմիր՝ դեպի հետ։ Բացի այդ, յուրաքանչյուր հետիոտն պետք է ունենա լուսատու կամ լուսաանդրադարձող տարր, որը տեսանելի է 150 m հեռավորությունից։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '059'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '060', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '060');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una niña de doce años circula en bicicleta por la acera acompañada por su madre, que va a pie. ¿Puede permitirlo la ordenanza municipal?$t$, $t$No, porque la excepción solo alcanza a los menores de doce años.$t$, $t$Sí, porque tiene doce años y va a cargo de una persona adulta que circula a pie.$t$, $t$No, porque ninguna ordenanza municipal puede autorizar bicicletas en la acera.$t$, $t$Las ordenanzas pueden permitir que los niños de hasta doce años, inclusive, vayan en bici por la acera si los acompaña un adulto a pie. Se deben dar a la vez las tres condiciones: hasta doce años, en bicicleta y acompañante a pie. La niña de doce años con su madre andando cumple todas.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '060'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A twelve-year-old girl is riding a bicycle on the pavement accompanied by her mother, who is walking. May a municipal ordinance permit this?$t$, $t$No, because the exception only covers children under twelve.$t$, $t$Yes, because she is twelve and is in the care of an adult on foot.$t$, $t$No, because no municipal ordinance can authorise bicycles on pavements.$t$, $t$Ordinances may allow children up to and including twelve to cycle on the pavement if accompanied by an adult on foot. Three conditions must hold together: aged twelve or under, on a bicycle, with the companion on foot. A twelve-year-old with her mother walking meets all three.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '060'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Двенадцатилетняя девочка едет на велосипеде по тротуару, рядом идёт её мама. Может ли местное постановление это разрешить?$t$, $t$Нет, потому что исключение касается только детей младше двенадцати.$t$, $t$Да, потому что ей двенадцать лет, и с ней идёт взрослый пешком.$t$, $t$Нет, потому что ни одно местное постановление не может разрешить велосипеды на тротуаре.$t$, $t$Муниципальные правила могут разрешить детям до двенадцати лет включительно ездить на велосипеде по тротуару, если их сопровождает взрослый, идущий пешком. Условия действуют вместе: возраст не больше двенадцати, велосипед, сопровождающий идёт пешком. Девочка двенадцати лет с мамой-пешеходом подходит под все три.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '060'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Տասներկուամյա աղջիկը հեծանիվով երթևեկում է մայթով, իսկ կողքով քայլում է նրա մայրը։ Կարո՞ղ է համայնքային կանոնակարգը դա թույլատրել։$t$, $t$Ոչ, քանի որ բացառությունը վերաբերում է միայն տասներկու տարեկանից փոքր երեխաներին։$t$, $t$Այո, քանի որ նա տասներկու տարեկան է, և նրան ուղեկցում է ոտքով քայլող չափահաս անձ։$t$, $t$Ոչ, քանի որ ոչ մի համայնքային կանոնակարգ չի կարող թույլատրել հեծանիվների երթևեկությունը մայթով։$t$, $t$Համայնքային կանոնակարգերը կարող են թույլատրել մինչև տասներկու տարեկան (ներառյալ) երեխաներին հեծանիվով երթևեկել մայթով, եթե նրանց ուղեկցում է ոտքով քայլող չափահաս անձ։ Պայմանները գործում են միաժամանակ՝ տարիքը՝ ոչ ավելի, քան տասներկու տարեկան, հեծանիվ, ուղեկցողը քայլում է ոտքով։ Տասներկու տարեկան աղջիկը՝ ոտքով քայլող մոր հետ, բավարարում է բոլոր երեք պայմանները։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '060'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '061', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '061');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista de 17 años transporta varios paquetes en el portaequipajes de su bicicleta. ¿Está permitido?$t$, $t$No, porque el conductor debe ser mayor de edad.$t$, $t$Sí, si los paquetes están bien sujetos al portaequipajes.$t$, $t$Sí, si la carga no compromete la estabilidad de la bicicleta.$t$, $t$Para transportar carga o pasajeros en bicicleta hay que ser mayor de edad. Con 17 años no se puede, aunque la carga vaya bien sujeta y no comprometa la estabilidad. La sujeción segura es un requisito adicional, no sustituye a la edad.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '061'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A 17-year-old cyclist is carrying several parcels on the luggage rack of their bicycle. Is this permitted?$t$, $t$No, because the rider must be of legal age.$t$, $t$Yes, if the parcels are securely fastened to the rack.$t$, $t$Yes, if the load does not compromise the bicycle's stability.$t$, $t$To carry cargo or passengers on a bicycle the rider must be of legal age. At 17 this is not allowed, even if the load is well secured and does not affect stability. Secure fastening is an extra requirement, not a substitute for age.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '061'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Семнадцатилетний велосипедист везёт несколько посылок на багажнике велосипеда. Разрешено ли это?$t$, $t$Нет, потому что водитель должен быть совершеннолетним.$t$, $t$Да, если посылки надёжно закреплены на багажнике.$t$, $t$Да, если груз не нарушает устойчивость велосипеда.$t$, $t$Перевозить груз или пассажиров на велосипеде разрешено только совершеннолетним. В 17 лет это нельзя, даже если груз хорошо закреплён и не влияет на устойчивость. Надёжное крепление — дополнительное условие, оно не заменяет возраст.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '061'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Տասնյոթամյա հեծանվորդը հեծանիվի բեռնակրի վրա մի քանի ծանրոց է տեղափոխում։ Թույլատրվո՞ւմ է դա։$t$, $t$Ոչ, քանի որ վարորդը պետք է չափահաս լինի։$t$, $t$Այո, եթե ծանրոցները հուսալիորեն ամրացված են բեռնակրին։$t$, $t$Այո, եթե բեռը չի խախտում հեծանիվի կայունությունը։$t$, $t$Հեծանիվով բեռ կամ ուղևորներ տեղափոխել թույլատրվում է միայն չափահասներին։ 17 տարեկանում դա չի կարելի, նույնիսկ եթե բեռը լավ ամրացված է և չի ազդում կայունության վրա։ Հուսալի ամրացումը լրացուցիչ պայման է, այն չի փոխարինում տարիքային պահանջին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '061'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '062', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '062');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una vía donde el ayuntamiento autoriza la circulación de patinetes eléctricos, un turismo sigue a uno de ellos por el mismo carril y deja cuatro metros entre ambos. ¿Es correcta esta separación?$t$, $t$Sí, si circula a velocidad reducida.$t$, $t$No, debe dejar al menos cinco metros.$t$, $t$Sí, si puede detenerse sin alcanzarlo.$t$, $t$Cuando un turismo va detrás de un VMP por el mismo carril, debe dejar al menos cinco metros, igual que con un ciclista. Cuatro metros no bastan, aunque vaya despacio o pudiera frenar a tiempo. Esa distancia le da tiempo a reaccionar si el patinete frena o se desvía.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '062'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$On a road where the council permits electric scooters, a car follows one of them in the same lane, leaving four metres between them. Is this separation correct?$t$, $t$Yes, if the driver is travelling at low speed.$t$, $t$No, the driver must leave at least five metres.$t$, $t$Yes, if the driver can stop without hitting it.$t$, $t$When a car follows a PMV in the same lane, it must keep at least five metres back, as with a cyclist. Four metres is not enough, even at low speed or if the driver could brake in time. That gap gives time to react if the scooter slows or swerves.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '062'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На дороге, где муниципалитет разрешает электросамокаты, легковая машина едет за одним из них по той же полосе, оставляя четыре метра. Правильна ли такая дистанция?$t$, $t$Да, если водитель едет на малой скорости.$t$, $t$Нет, нужно оставить не менее пяти метров.$t$, $t$Да, если водитель успеет остановиться, не столкнувшись.$t$, $t$Когда машина едет за СИМ по той же полосе, дистанция должна быть не менее пяти метров, как и за велосипедистом. Четырёх метров мало, даже на малой скорости или если успеть затормозить. Такой запас даёт время среагировать, если самокат замедлится или свернёт.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '062'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ճանապարհին, որտեղ քաղաքապետարանը թույլատրում է էլեկտրական սկուտերների երթևեկությունը, մարդատար ավտոմեքենան նույն երթևեկության գոտիով ընթանում է դրանցից մեկի հետևից՝ թողնելով չորս մետր հեռավորություն։ Ճի՞շտ է արդյոք այդ հեռավորությունը։$t$, $t$Այո, եթե վարորդն ընթանում է ցածր արագությամբ։$t$, $t$Ոչ, պետք է թողնել առնվազն հինգ մետր։$t$, $t$Այո, եթե վարորդը կհասցնի կանգ առնել՝ առանց բախվելու։$t$, $t$Երբ ավտոմեքենան նույն երթևեկության գոտիով ընթանում է անհատական շարժունակության միջոցի (ԱՇՄ) հետևից, հեռավորությունը պետք է լինի առնվազն հինգ մետր, ինչպես և հեծանվորդի հետևից ընթանալիս։ Չորս մետրը քիչ է, նույնիսկ ցածր արագության դեպքում կամ եթե հնարավոր է ժամանակին արգելակել։ Այդպիսի հեռավորությունը ժամանակ է տալիս արձագանքելու, եթե սկուտերը դանդաղեցնի ընթացքը կամ շեղվի։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '062'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'factores-riesgo', 'own', 'rd518-2026', '063', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '063');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una persona con movilidad reducida se desplaza en un patinete eléctrico al paso de una persona. A efectos de las normas de circulación, ¿qué consideración tiene?$t$, $t$La de conductor de patinete, por el vehículo que utiliza.$t$, $t$La de ciclista, por la velocidad a la que circula.$t$, $t$La de peatón, por su movilidad reducida y su velocidad.$t$, $t$Una persona con movilidad reducida que usa un VMP a paso de peatón se considera peatón a efectos de las normas de circulación. Se unen los tres rasgos: movilidad reducida, desplazamiento en VMP y velocidad de paseo. Se le aplican, por tanto, las reglas de los peatones.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '063'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A person with reduced mobility is travelling on an electric scooter at walking pace. For the purposes of traffic regulations, how are they classified?$t$, $t$As a scooter rider, because of the vehicle they are using.$t$, $t$As a cyclist, because of the speed they travel at.$t$, $t$As a pedestrian, because of their reduced mobility and speed.$t$, $t$A person with reduced mobility using a PMV at walking pace is treated as a pedestrian for traffic rules. All three features come together: reduced mobility, travel on a PMV and walking speed. The pedestrian rules therefore apply to them.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '063'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Человек с ограниченной подвижностью едет на электросамокате со скоростью пешехода. Кем он считается по правилам дорожного движения?$t$, $t$Водителем самоката, из-за транспортного средства.$t$, $t$Велосипедистом, из-за скорости.$t$, $t$Пешеходом, учитывая его ограниченную подвижность и скорость.$t$, $t$Человек с ограниченной подвижностью, передвигающийся на СИМ со скоростью шага, считается пешеходом. Здесь совпадают три признака: ограниченная подвижность, СИМ и скорость пешехода. Поэтому к нему применяются правила для пешеходов.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '063'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Սահմանափակ շարժունակությամբ անձը էլեկտրական սկուտերով տեղաշարժվում է հետիոտնի արագությամբ։ Ի՞նչ կարգավիճակ ունի նա ըստ ճանապարհային երթևեկության կանոնների։$t$, $t$Սկուտերի վարորդի՝ տրանսպորտային միջոցի պատճառով։$t$, $t$Հեծանվորդի՝ արագության պատճառով։$t$, $t$Հետիոտնի՝ հաշվի առնելով նրա սահմանափակ շարժունակությունն ու արագությունը։$t$, $t$Սահմանափակ շարժունակությամբ անձը, որը անհատական շարժունակության միջոցով (ԱՇՄ) տեղաշարժվում է քայլքի արագությամբ, համարվում է հետիոտն։ Այստեղ համընկնում են երեք հատկանիշ՝ սահմանափակ շարժունակություն, ԱՇՄ և հետիոտնի արագություն։ Ուստի նրա նկատմամբ կիրառվում են հետիոտների համար սահմանված կանոնները։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '063'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'sri-cinturon-casco', 'own', 'rd518-2026', '064', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '064');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un ciclista circula de noche por una vía interurbana con una luz en el casco conforme a la normativa de los equipos de protección individual y visible a 150 metros, pero sin ninguna prenda reflectante. ¿Cumple la norma?$t$, $t$No, en vía interurbana debe llevar además una prenda reflectante.$t$, $t$Sí, basta un elemento luminoso o reflectante conforme a la normativa de protección individual.$t$, $t$No, los ciclistas no pueden circular de noche por vías interurbanas.$t$, $t$Antes del 1 de octubre de 2026 hacía falta una prenda reflectante. Ahora basta un elemento luminoso o reflectante que cumpla la normativa de protección individual y se vea desde 150 m. Una luz en el casco lo cumple. El alumbrado de la bicicleta es una exigencia aparte.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '064'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A cyclist is riding at night on a road outside a built-up area with a helmet light that meets personal protective equipment rules and is visible from 150 metres, but without any reflective garment. Is the cyclist complying with the rules?$t$, $t$No, on a road outside built-up areas the cyclist must also wear a reflective garment.$t$, $t$Yes, one luminous or reflective element meeting the personal protective equipment rules is enough.$t$, $t$No, cyclists may not ride on roads outside built-up areas at night.$t$, $t$Before 1 October 2026 a reflective garment was required. Now one luminous or reflective element meeting the personal-protection rules and visible from 150 m is enough. A helmet light qualifies. The bicycle's own lighting is a separate requirement.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '064'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Велосипедист едет ночью по загородной дороге с фонарём на шлеме, отвечающим нормам средств защиты и видимым со 150 м, но без светоотражающей одежды. Соблюдает ли он правила?$t$, $t$Нет, за городом ему нужно дополнительно надеть светоотражающую одежду.$t$, $t$Да, достаточно одного светящегося или светоотражающего элемента, отвечающего нормам средств защиты.$t$, $t$Нет, велосипедистам нельзя ездить ночью по загородным дорогам.$t$, $t$До 1 октября 2026 года светоотражающая одежда была обязательна. Теперь достаточно одного светящегося или светоотражающего элемента, отвечающего нормам средств защиты и видимого со 150 м. Фонарь на шлеме подходит. Освещение самого велосипеда — отдельное требование.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '064'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Հեծանվորդը գիշերը երթևեկում է բնակավայրից դուրս գտնվող ճանապարհով՝ սաղավարտին ամրացված լույսով, որը համապատասխանում է անհատական պաշտպանության միջոցների նորմերին և տեսանելի է 150 m հեռավորությունից, սակայն առանց լուսաանդրադարձող հագուստի։ Պահպանո՞ւմ է նա կանոնները։$t$, $t$Ոչ, բնակավայրից դուրս նա պետք է լրացուցիչ կրի լուսաանդրադարձող հագուստ։$t$, $t$Այո, բավական է մեկ լուսատու կամ լուսաանդրադարձող տարր, որը համապատասխանում է անհատական պաշտպանության միջոցների նորմերին։$t$, $t$Ոչ, հեծանվորդներին արգելվում է գիշերը երթևեկել բնակավայրից դուրս գտնվող ճանապարհներով։$t$, $t$Մինչև 2026 թվականի հոկտեմբերի 1-ը լուսաանդրադարձող հագուստը պարտադիր էր։ Այժմ բավական է մեկ լուսատու կամ լուսաանդրադարձող տարր, որը համապատասխանում է անհատական պաշտպանության միջոցների նորմերին և տեսանելի է 150 m հեռավորությունից։ Սաղավարտին ամրացված լույսը բավարարում է այդ պահանջը։ Բուն հեծանիվի լուսավորությունը առանձին պահանջ է։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '064'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'estacionamiento', 'own', 'rd518-2026', '065', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '065');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una zona urbana de estacionamiento regulado, un ayuntamiento fija tarifas distintas según las dimensiones del vehículo y su clasificación ambiental. ¿Está permitido?$t$, $t$Sí, pero solo puede considerar las dimensiones del vehículo.$t$, $t$No, todos los vehículos deben pagar siempre la misma tarifa.$t$, $t$Sí, si ambos criterios figuran en la ordenanza municipal.$t$, $t$El ayuntamiento puede fijar tarifas distintas de estacionamiento regulado atendiendo a las dimensiones del vehículo y a su clasificación ambiental, siempre que ambos criterios consten en la ordenanza. Así se tiene en cuenta cuánto espacio ocupa y cuánto contamina.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '065'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$In a regulated urban parking zone, a municipality sets different rates according to the vehicle's dimensions and environmental classification. Is this permitted?$t$, $t$Yes, but only the vehicle's dimensions may be considered.$t$, $t$No, all vehicles must always pay the same rate.$t$, $t$Yes, if both criteria are included in the municipal ordinance.$t$, $t$A council may set different rates in regulated parking according to a vehicle's dimensions and its environmental classification, provided both criteria are written into the ordinance. That reflects how much space it takes and how much it pollutes.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '065'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$В городской зоне регулируемой парковки муниципалитет устанавливает разные тарифы в зависимости от габаритов автомобиля и его экологического класса. Разрешено ли это?$t$, $t$Да, но учитывать можно только габариты.$t$, $t$Нет, все автомобили всегда платят по одному тарифу.$t$, $t$Да, если оба критерия закреплены в муниципальном постановлении.$t$, $t$Муниципалитет вправе назначать разные тарифы на регулируемой парковке с учётом габаритов автомобиля и его экологического класса, если оба критерия указаны в постановлении. Так учитывается, сколько места занимает машина и насколько она загрязняет воздух.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '065'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Քաղաքային կարգավորվող կայանման գոտում քաղաքապետարանը սահմանում է տարբեր սակագներ՝ կախված ավտոմեքենայի եզրաչափերից և բնապահպանական դասից։ Թույլատրվո՞ւմ է դա։$t$, $t$Այո, բայց կարելի է հաշվի առնել միայն եզրաչափերը։$t$, $t$Ոչ, բոլոր ավտոմեքենաները միշտ վճարում են նույն սակագնով։$t$, $t$Այո, եթե երկու չափանիշներն էլ ամրագրված են համայնքային կանոնակարգում։$t$, $t$Քաղաքապետարանն իրավունք ունի կարգավորվող կայանման համար սահմանել տարբեր սակագներ՝ հաշվի առնելով ավտոմեքենայի եզրաչափերը և բնապահպանական դասը, եթե երկու չափանիշներն էլ նշված են կանոնակարգում։ Այդպես հաշվի է առնվում, թե որքան տեղ է զբաղեցնում մեքենան և որքան է այն աղտոտում օդը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '065'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'documentacion', 'own', 'rd518-2026', '066', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '066');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una persona que carece de permiso de conducción matricula un turismo a su nombre. ¿Está obligada a designar un conductor habitual?$t$, $t$Sí, debe designarlo al matricular el vehículo.$t$, $t$Solo si el vehículo se utilizará de forma habitual.$t$, $t$No, puede designarlo más adelante voluntariamente.$t$, $t$Quien no tiene permiso de conducir puede ser titular de un coche, pero al matricularlo debe designar un conductor habitual. Es la falta de permiso del titular la que lo hace obligatorio, y no importa con qué frecuencia se vaya a usar. El conductor habitual debe tener permiso de la clase adecuada y aceptar la designación.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '066'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A person who does not have a driving licence registers a passenger car in their name. Are they required to designate a regular driver?$t$, $t$Yes, they must designate one when registering the vehicle.$t$, $t$Only if the vehicle will be used regularly.$t$, $t$No, they may designate one voluntarily at a later date.$t$, $t$A person without a driving licence may own a car, but when registering it must designate a regular driver. It is the owner's lack of a licence that makes it compulsory, and how often the car will be used does not matter. The regular driver must hold a licence of the right class and accept the designation.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '066'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Человек без водительского удостоверения регистрирует легковой автомобиль на своё имя. Обязан ли он назначить постоянного водителя?$t$, $t$Да, назначить нужно при регистрации автомобиля.$t$, $t$Только если автомобиль будет использоваться регулярно.$t$, $t$Нет, он может назначить его позже по желанию.$t$, $t$Человек без прав может владеть машиной, но при её регистрации обязан назначить постоянного водителя. Обязательным это делает именно отсутствие прав у владельца, а частота использования машины значения не имеет. У постоянного водителя должно быть удостоверение нужной категории, и он должен согласиться на назначение.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '066'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Վարորդական վկայական չունեցող անձը մարդատար ավտոմեքենան հաշվառում է իր անունով։ Պարտավո՞ր է նա նշանակել մշտական վարորդ։$t$, $t$Այո, նշանակել պետք է ավտոմեքենան հաշվառելիս։$t$, $t$Միայն եթե ավտոմեքենան օգտագործվելու է կանոնավոր կերպով։$t$, $t$Ոչ, նա կարող է նշանակել ավելի ուշ՝ իր ցանկությամբ։$t$, $t$Վարորդական վկայական չունեցող անձը կարող է ավտոմեքենայի սեփականատեր լինել, սակայն այն հաշվառելիս պարտավոր է նշանակել մշտական վարորդ։ Դա պարտադիր է դարձնում հենց սեփականատիրոջ վկայական չունենալը, իսկ ավտոմեքենայի օգտագործման հաճախականությունը նշանակություն չունի։ Մշտական վարորդը պետք է ունենա համապատասխան կարգի վարորդական վկայական և համաձայնի նշանակմանը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '066'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '067', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '067');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una zona con plataforma única de calzada y acera, un peatón cruza por un punto de la calzada sin paso señalizado. ¿Debe el conductor cederle el paso?$t$, $t$Sí, porque el peatón tiene prioridad en cualquier punto de la calzada.$t$, $t$No, salvo que el peatón ya se encuentre en medio de la calzada.$t$, $t$No, porque debe utilizar un paso para peatones debidamente señalizado.$t$, $t$En las calles de plataforma única, donde calzada y acera están a un mismo nivel, el peatón tiene prioridad en cualquier punto de la calzada. El conductor debe cederle el paso aunque no haya un paso señalizado. Que exista o no un paso marcado no decide la prioridad.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '067'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$In an area where the carriageway and pavement are on a single level, a pedestrian crosses the carriageway at a point without a marked crossing. Must the driver give way?$t$, $t$Yes, because the pedestrian has priority at any point on the carriageway.$t$, $t$No, unless the pedestrian is already in the middle of the carriageway.$t$, $t$No, because the pedestrian must use a properly marked crossing.$t$, $t$On shared-surface streets, where carriageway and pavement are at one level, pedestrians have priority at any point of the carriageway. The driver must give way even without a marked crossing. Whether a marked crossing exists does not decide priority.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '067'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На улице с единым полотном проезжей части и тротуара пешеход переходит дорогу в месте без обозначенного перехода. Должен ли водитель уступить?$t$, $t$Да, потому что у пешехода приоритет в любой точке проезжей части.$t$, $t$Нет, кроме случая, когда пешеход уже посередине дороги.$t$, $t$Нет, потому что пешеход должен пользоваться обозначенным переходом.$t$, $t$На улицах с единым полотном, где проезжая часть и тротуар на одном уровне, у пешеходов приоритет в любой точке проезжей части. Водитель обязан уступить, даже если обозначенного перехода нет. Наличие разметки перехода на приоритет не влияет.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '067'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Փողոցում, որտեղ երթևեկելի մասն ու մայթը միասնական հարթակ են կազմում, հետիոտնը ճանապարհն անցնում է այնպիսի տեղում, որտեղ նշված հետիոտնային անցում չկա։ Պե՞տք է արդյոք վարորդը զիջի ճանապարհը։$t$, $t$Այո, քանի որ հետիոտնն առավելություն ունի երթևեկելի մասի ցանկացած կետում։$t$, $t$Ոչ, բացառությամբ այն դեպքի, երբ հետիոտնն արդեն ճանապարհի մեջտեղում է։$t$, $t$Ոչ, քանի որ հետիոտնը պետք է օգտվի նշված հետիոտնային անցումից։$t$, $t$Միասնական հարթակով փողոցներում, որտեղ երթևեկելի մասն ու մայթը նույն մակարդակի վրա են, հետիոտներն առավելություն ունեն երթևեկելի մասի ցանկացած կետում։ Վարորդը պարտավոր է զիջել ճանապարհը, նույնիսկ եթե նշված հետիոտնային անցում չկա։ Անցման գծանշման առկայությունը առավելության վրա չի ազդում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '067'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '068', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '068');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$En una motocicleta viajan un conductor y un pasajero, ambos adultos. ¿Quién de ellos tiene la consideración de usuario vulnerable de la vía?$t$, $t$Solo el conductor, porque es quien conduce la motocicleta.$t$, $t$Los dos ocupantes: tanto el conductor como el pasajero.$t$, $t$Solo el pasajero, porque no conduce la motocicleta.$t$, $t$En una motocicleta son usuarios vulnerables todos los ocupantes, el conductor y el pasajero, porque la condición depende del modo de desplazamiento y del mayor riesgo de lesiones en un siniestro. Igualmente lo son ciclistas, conductores de VMP y conductores y pasajeros de ciclomotores. Los peatones también lo son.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '068'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A rider and a passenger, both adults, are travelling on a motorcycle. Which of them is considered a vulnerable road user?$t$, $t$Only the rider, because they operate the motorcycle.$t$, $t$Both occupants: the rider and the passenger.$t$, $t$Only the passenger, because they do not operate the motorcycle.$t$, $t$On a motorcycle everyone aboard, rider and passenger, is a vulnerable road user, because the status depends on the mode of travel and the higher risk of injury in a crash. Cyclists, PMV riders and moped riders and passengers are too. Pedestrians also count.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '068'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$На мотоцикле едут водитель и пассажир, оба взрослые. Кто из них считается уязвимым участником дорожного движения?$t$, $t$Только водитель, потому что он управляет мотоциклом.$t$, $t$Оба: и водитель, и пассажир.$t$, $t$Только пассажир, потому что он не управляет мотоциклом.$t$, $t$На мотоцикле уязвимыми участниками считаются все, кто на нём едет: и водитель, и пассажир. Статус связан со способом передвижения и повышенным риском травм при аварии. Так же уязвимыми считаются велосипедисты, водители СИМ, а также водители и пассажиры мопедов. Пешеходы тоже относятся к этой группе.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '068'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մոտոցիկլով երթևեկում են վարորդն ու ուղևորը, երկուսն էլ չափահաս։ Նրանցից ո՞վ է համարվում ճանապարհային երթևեկության խոցելի մասնակից։$t$, $t$Միայն վարորդը, քանի որ նա է վարում մոտոցիկլը։$t$, $t$Երկուսն էլ՝ և՛ վարորդը, և՛ ուղևորը։$t$, $t$Միայն ուղևորը, քանի որ նա չի վարում մոտոցիկլը։$t$, $t$Մոտոցիկլի դեպքում խոցելի մասնակիցներ են համարվում բոլորը, ովքեր դրանով երթևեկում են՝ և՛ վարորդը, և՛ ուղևորը։ Այդ կարգավիճակը կապված է տեղաշարժման եղանակի և վթարի դեպքում վնասվածքներ ստանալու բարձր ռիսկի հետ։ Նույն կերպ խոցելի են համարվում հեծանվորդները, անհատական շարժունակության միջոցների (ԱՇՄ) վարորդները, ինչպես նաև մոպեդների վարորդներն ու ուղևորները։ Հետիոտները նույնպես պատկանում են այս խմբին։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '068'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'a', null, 'peatones-ciclistas', 'own', 'rd518-2026', '069', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '069');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Antes de iniciar un viaje, el conductor de una motocicleta comprueba que no lleva consigo ningún chaleco reflectante de alta visibilidad. ¿Puede circular así?$t$, $t$No, debe llevar consigo un chaleco reflectante.$t$, $t$Sí, porque solo es obligatorio en los turismos.$t$, $t$Sí, si circula únicamente por vías urbanas.$t$, $t$El chaleco reflectante de alta visibilidad, conforme a la normativa de protección individual, forma parte del equipamiento obligatorio de la motocicleta. El conductor debe llevarlo consigo en cualquier tipo de vía, no solo en los turismos.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '069'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Before setting off on a journey, a motorcycle rider finds that they do not carry a high-visibility reflective vest. May they ride like this?$t$, $t$No, the rider must carry a reflective vest.$t$, $t$Yes, because the vest is compulsory only in cars.$t$, $t$Yes, if the rider travels only on urban roads.$t$, $t$The high-visibility reflective vest, meeting the personal-protection standard, is part of a motorcycle's compulsory equipment. The rider must carry it on any type of road, not only in cars.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '069'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Перед поездкой мотоциклист обнаруживает, что светоотражающего жилета повышенной видимости с собой нет. Может ли он ехать так?$t$, $t$Нет, жилет должен быть с собой.$t$, $t$Да, потому что жилет обязателен только в легковых автомобилях.$t$, $t$Да, если он едет только по городским дорогам.$t$, $t$Светоотражающий жилет повышенной видимости, отвечающий нормам средств защиты, входит в обязательную комплектацию мотоцикла. Водитель должен иметь его с собой на любой дороге, а не только в легковых автомобилях.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '069'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Ուղևորությունից առաջ մոտոցիկլի վարորդը հայտնաբերում է, որ իր մոտ չկա բարձր տեսանելիության լուսաանդրադարձող բաճկոն։ Կարո՞ղ է նա այդպես երթևեկել։$t$, $t$Ոչ, բաճկոնը պետք է իր մոտ լինի։$t$, $t$Այո, քանի որ բաճկոնը պարտադիր է միայն մարդատար ավտոմեքենաներում։$t$, $t$Այո, եթե նա երթևեկում է միայն քաղաքային ճանապարհներով։$t$, $t$Բարձր տեսանելիության լուսաանդրադարձող բաճկոնը, որը համապատասխանում է անհատական պաշտպանության միջոցների նորմերին, մտնում է մոտոցիկլի պարտադիր համալրման մեջ։ Վարորդը պետք է այն իր մոտ ունենա ցանկացած ճանապարհի վրա. այն պարտադիր է ոչ միայն մարդատար ավտոմեքենաներում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '069'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '070', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '070');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Una ciclista mayor de edad quiere llevar en una bicicleta construida para una sola persona a un menor de 18 kg que ya se sienta por sí solo. Mientras no sea aplicable la orden que regula las características técnicas de los asientos adicionales, ¿puede hacerlo?$t$, $t$Sí, si el asiento queda firmemente sujeto.$t$, $t$Sí, si el asiento adicional está homologado.$t$, $t$No, las bicicletas de una plaza no admiten pasajeros.$t$, $t$Una bicicleta de una plaza puede llevar a un niño en un asiento adicional homologado si quien pedalea es mayor de edad y el niño pesa hasta 22 kg y se sienta solo. Que el asiento vaya firmemente sujeto no basta, y la bicicleta de una plaza no queda excluida.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '070'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$An adult cyclist wants to carry a child weighing 18 kg who can already sit unaided on a bicycle designed for one person. While the order governing the technical specifications for additional seats is not yet applicable, may she do so?$t$, $t$Yes, if the seat is securely attached.$t$, $t$Yes, if the additional seat is type-approved.$t$, $t$No, single-seat bicycles cannot carry passengers.$t$, $t$A single-seat bicycle may carry a child in a type-approved additional seat if the rider is an adult and the child weighs up to 22 kg and can sit unaided. A firmly attached seat is not enough, and a one-person bicycle is not excluded.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '070'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Взрослая велосипедистка хочет везти на велосипеде, рассчитанном на одного человека, ребёнка весом 18 кг, который уже умеет сидеть сам. Может ли она так делать, пока не применяется приказ о технических характеристиках дополнительных сидений?$t$, $t$Да, если сиденье надёжно закреплено.$t$, $t$Да, если дополнительное сиденье официально одобрено (омологировано).$t$, $t$Нет, на одноместных велосипедах нельзя возить пассажиров.$t$, $t$На одноместном велосипеде можно возить ребёнка в одобренном дополнительном сиденье, если водитель совершеннолетний, а ребёнок весит не более 22 кг и умеет сидеть самостоятельно. Одного надёжного крепления недостаточно, а одноместный велосипед не исключён.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '070'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Չափահաս հեծանվորդուհին ցանկանում է մեկ անձի համար նախատեսված հեծանիվով տեղափոխել 18 kg քաշ ունեցող երեխայի, որն արդեն կարողանում է ինքնուրույն նստել։ Կարո՞ղ է նա այդպես վարվել, քանի դեռ չի կիրառվում լրացուցիչ նստատեղերի տեխնիկական բնութագրերի մասին հրամանը։$t$, $t$Այո, եթե նստատեղը հուսալիորեն ամրացված է։$t$, $t$Այո, եթե լրացուցիչ նստատեղը պաշտոնապես հաստատված է (հոմոլոգացված)։$t$, $t$Ոչ, մեկտեղանոց հեծանիվներով չի կարելի ուղևորներ տեղափոխել։$t$, $t$Մեկտեղանոց հեծանիվով կարելի է երեխա տեղափոխել հաստատված (հոմոլոգացված) լրացուցիչ նստատեղով, եթե վարորդը չափահաս է, իսկ երեխան կշռում է ոչ ավելի, քան 22 kg և կարողանում է ինքնուրույն նստել։ Միայն հուսալի ամրացումը բավարար չէ, իսկ մեկտեղանոց հեծանիվը բացառված չէ։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '070'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'peatones-ciclistas', 'own', 'rd518-2026', '071', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '071');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Varios ciclistas circulan de noche por un arcén transitable y suficientemente ancho. ¿Cómo deben hacerlo?$t$, $t$En columna de a dos, si no dificultan la fluidez de la circulación.$t$, $t$En columna de a dos, sin ocupar en ningún caso la calzada.$t$, $t$En columna de a uno, aunque el arcén sea transitable y suficiente.$t$, $t$De noche los ciclistas van siempre en fila de uno, aunque el arcén sea ancho y practicable. La columna de a dos solo es posible de día y en buenas condiciones de visibilidad. Si no hay arcén utilizable, pueden ocupar la parte mínima necesaria de la calzada.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '071'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$Several cyclists are riding at night on a passable and sufficiently wide shoulder. How must they ride?$t$, $t$Two abreast, provided they do not impede the flow of traffic.$t$, $t$Two abreast, without using the carriageway under any circumstances.$t$, $t$In single file, even if the shoulder is passable and sufficient.$t$, $t$At night cyclists always ride in single file, even if the shoulder is wide and usable. Riding two abreast is possible only by day and in good visibility. If there is no usable shoulder they may take the minimum necessary part of the carriageway.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '071'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Несколько велосипедистов едут ночью по пригодной и достаточно широкой обочине. Как они должны ехать?$t$, $t$По двое, если это не мешает движению транспорта.$t$, $t$По двое, ни при каких обстоятельствах не заезжая на проезжую часть.$t$, $t$В один ряд, даже если обочина пригодна и достаточно широка.$t$, $t$Ночью велосипедисты всегда едут в один ряд, даже если обочина широкая и проезжая. Колонной по двое можно ехать только днём и при хорошей видимости. Если пригодной обочины нет, можно занять минимально необходимую часть проезжей части.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '071'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Մի քանի հեծանվորդ գիշերը երթևեկում են պիտանի և բավականաչափ լայն երթևեկելի եզրագոտիով։ Ինչպե՞ս պետք է նրանք երթևեկեն։$t$, $t$Երկուական շարասյունով, եթե դա չի խանգարում տրանսպորտի երթևեկությանը։$t$, $t$Երկուական շարասյունով՝ ոչ մի դեպքում դուրս չգալով երթևեկելի մաս։$t$, $t$Մեկ շարքով, նույնիսկ եթե երթևեկելի եզրագոտին պիտանի է և բավականաչափ լայն։$t$, $t$Գիշերը հեծանվորդները միշտ երթևեկում են մեկ շարքով, նույնիսկ եթե երթևեկելի եզրագոտին լայն է և անցանելի։ Երկուական շարասյունով կարելի է երթևեկել միայն ցերեկը և լավ տեսանելիության պայմաններում։ Եթե պիտանի երթևեկելի եզրագոտի չկա, կարելի է զբաղեցնել երթևեկելի մասի նվազագույն անհրաժեշտ հատվածը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '071'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'b', null, 'peatones-ciclistas', 'own', 'rd518-2026', '072', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '072');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un menor pesa 21 kg y puede sentarse por sí solo. Por sus características, ¿puede ocupar un asiento adicional en una bicicleta construida para una sola persona?$t$, $t$No, porque solo pueden ocuparlo menores de hasta 7 años.$t$, $t$Sí, porque no supera los 22 kg y puede sentarse por sí solo.$t$, $t$No, porque el peso máximo permitido para ocuparlo es de 15 kg.$t$, $t$En el asiento adicional de una bicicleta de una plaza puede ir un niño de hasta 22 kg inclusive que se siente solo. Lo lleva un adulto, y el asiento debe estar homologado. El límite de 7 años ya no se aplica desde el 1 de octubre de 2026.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '072'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A child weighs 21 kg and can sit unaided. Based on these characteristics, may the child use an additional seat on a bicycle designed for one person?$t$, $t$No, because only children up to 7 years old may use it.$t$, $t$Yes, because the child weighs no more than 22 kg and can sit unaided.$t$, $t$No, because the maximum weight allowed is 15 kg.$t$, $t$A child of up to and including 22 kg who can sit unaided may ride in an additional seat on a one-person bicycle. An adult must carry the child, and the seat must be type-approved. The 7-year age limit no longer applies since 1 October 2026.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '072'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Ребёнок весит 21 кг и умеет сидеть самостоятельно. Может ли он ехать на дополнительном сиденье велосипеда, рассчитанного на одного человека?$t$, $t$Нет, потому что на таком сиденье можно возить только детей до 7 лет.$t$, $t$Да, потому что он весит не больше 22 кг и умеет сидеть сам.$t$, $t$Нет, потому что предельный вес пассажира на таком сиденье — 15 кг.$t$, $t$На дополнительном сиденье одноместного велосипеда можно возить ребёнка весом до 22 кг включительно, если он умеет сидеть самостоятельно. Везти его должен совершеннолетний, а сиденье должно быть одобренным. Возрастной предел в 7 лет с 1 октября 2026 года не действует.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '072'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Երեխան կշռում է 21 kg և կարողանում է ինքնուրույն նստել։ Կարո՞ղ է նա երթևեկել մեկ անձի համար նախատեսված հեծանիվի լրացուցիչ նստատեղով։$t$, $t$Ոչ, քանի որ այդպիսի նստատեղով կարելի է տեղափոխել միայն մինչև 7 տարեկան երեխաների։$t$, $t$Այո, քանի որ նա կշռում է ոչ ավելի, քան 22 kg և կարողանում է ինքնուրույն նստել։$t$, $t$Ոչ, քանի որ այդպիսի նստատեղով ուղևորի առավելագույն թույլատրելի քաշը 15 kg է։$t$, $t$Մեկտեղանոց հեծանիվի լրացուցիչ նստատեղով կարելի է տեղափոխել մինչև 22 kg (ներառյալ) քաշ ունեցող երեխայի, եթե նա կարողանում է ինքնուրույն նստել։ Նրան պետք է տեղափոխի չափահաս անձը, իսկ նստատեղը պետք է լինի հաստատված (հոմոլոգացված)։ 7 տարեկանի տարիքային սահմանափակումը 2026 թվականի հոկտեմբերի 1-ից չի գործում։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '072'
on conflict (question_id, lang) do nothing;

insert into public.questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
select 'c', null, 'senales', 'own', 'rd518-2026', '073', true
where not exists (select 1 from public.questions where source = 'rd518-2026' and source_ref = '073');
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'es', $t$Un conductor lleva en la guantera de su turismo un detector de radares desconectado. ¿Está permitido?$t$, $t$Sí, porque no lo utiliza durante la conducción.$t$, $t$Sí, si no está instalado de forma permanente.$t$, $t$No, está prohibido llevarlo en el vehículo.$t$, $t$La prohibición alcanza a los detectores de radar por el mero hecho de llevarlos en el vehículo. Que estén apagados, guardados en la guantera o sin instalar de forma fija no cambia nada. Sí están permitidos los sistemas que solo avisan de dónde hay controles de tráfico.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '073'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'en', $t$A driver is carrying a switched-off radar detector in the glove compartment of their car. Is this permitted?$t$, $t$Yes, because the driver is not using it while driving.$t$, $t$Yes, if it is not permanently installed in the vehicle.$t$, $t$No, carrying it in the vehicle is prohibited.$t$, $t$The ban covers radar detectors simply by being carried in the vehicle. Being switched off, stored in the glove box or not permanently installed changes nothing. Systems that merely warn where traffic controls are located are allowed.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '073'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'ru', $t$Водитель возит в бардачке автомобиля выключенный радар-детектор. Разрешено ли это?$t$, $t$Да, потому что во время движения он им не пользуется.$t$, $t$Да, если он не закреплён в машине постоянно.$t$, $t$Нет, возить его в автомобиле запрещено.$t$, $t$Запрет распространяется на радар-детекторы уже за то, что их возят в автомобиле. То, что прибор выключен, лежит в бардачке и не закреплён, ничего не меняет. Разрешены системы, которые лишь сообщают, где расположены пункты дорожного контроля.$t$, 'reviewed'
from public.questions where source = 'rd518-2026' and source_ref = '073'
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
select id, 'hy', $t$Վարորդն ավտոմեքենայի ձեռնոցատուփում տեղափոխում է անջատված ռադար-դետեկտոր։ Թույլատրվո՞ւմ է դա։$t$, $t$Այո, քանի որ երթևեկության ընթացքում նա այն չի օգտագործում։$t$, $t$Այո, եթե այն մշտապես ամրացված չէ ավտոմեքենայում։$t$, $t$Ոչ, այն ավտոմեքենայում տեղափոխելն արգելված է։$t$, $t$Արգելքը տարածվում է ռադար-դետեկտորների վրա արդեն իսկ այն բանի համար, որ դրանք տեղափոխվում են ավտոմեքենայում։ Այն, որ սարքն անջատված է, դրված է ձեռնոցատուփում և ամրացված չէ, ոչինչ չի փոխում։ Թույլատրվում են այն համակարգերը, որոնք միայն տեղեկացնում են, թե որտեղ են գտնվում ճանապարհային հսկողության կետերը։$t$, 'machine'
from public.questions where source = 'rd518-2026' and source_ref = '073'
on conflict (question_id, lang) do nothing;

-- ---------- три теста в конце курса ----------
insert into public.tests (category, number, title, is_active)
select 'mixed', coalesce((select max(number) from public.tests where category = 'mixed'), 0) + s.i, 'ПДД с 1.10.26 · часть ' || s.i, true
from generate_series(1, 3) as s(i)
where not exists (
  select 1 from public.test_questions tq join public.questions qs on qs.id = tq.question_id where qs.source = 'rd518-2026'
);

insert into public.test_questions (test_category, test_number, position, question_id)
select 'mixed', t.number, r.rn - r.base, r.id
from (
  select id, row_number() over (order by source_ref) as rn,
         case when row_number() over (order by source_ref) <= 25 then 1
              when row_number() over (order by source_ref) <= 49 then 2 else 3 end as part
  from public.questions where source = 'rd518-2026'
) as x
cross join lateral (select x.id, x.rn, case x.part when 1 then 0 when 2 then 25 else 49 end as base) as r
join public.tests t on t.category = 'mixed' and t.title = 'ПДД с 1.10.26 · часть ' || x.part
where not exists (select 1 from public.test_questions tq where tq.question_id = x.id);

-- ---------- «Полезно» ----------
insert into public.useful_sections (title, sort)
select $j${"ru":"Изменения ПДД с 1.10.26","hy":""}$j$::jsonb, coalesce((select min(sort) from public.useful_sections), 10) - 10
where not exists (select 1 from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-obzor', '🆕', 'published', 10,
       $j${"ru":"Что изменилось с 1 октября 2026: обзор","hy":""}$j$::jsonb, $j${"ru":"Реформа Reglamento General de Circulación: кого защищает, что вступило в силу сразу и что отложено на 2027 год.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"text","text":"# Что за реформа\n**Real Decreto 518/2026 от 24 июня** меняет Общий регламент дорожного движения. Главная идея: защитить тех, кто на дороге уязвим. В закон введено понятие **уязвимых участников движения**: пешеходы, велосипедисты, водители и пассажиры мопедов и мотоциклов, пользователи СИМ (средств индивидуальной мобильности: электросамокатов, моноколёс и подобных).\n\nБольшая часть норм действует **с 1 октября 2026 года**. Две нормы отложены на год, а по прицепам и дополнительным сиденьям для детей ещё ждут отдельных технических приказов."},{"type":"image","url":"/new-rules/q16.png","caption":"Аварийный коридор в заторе: один из самых важных новых навыков"},{"type":"table","headers":["Что","С какой даты"],"rows":[["Основные нормы реформы (шлемы, ремни, обгон, пешеходы, СИМ и др.)","1 октября 2026"],["Свет СИМ горит всю поездку, в том числе днём","1 октября 2027"],["Мотоциклетные шлемы только гомологированные (не просто сертифицированные)","1 октября 2027"],["Технические требования к велосипедным прицепам и дополнительным сиденьям","ждут отдельного приказа"]]},{"type":"callout","tone":"warn","text":"Для экзамена и для штрафов решает действующая редакция. В нашем тесте вопрос про дневной свет СИМ помечен словами «Норма действует с 1 октября 2027 года»: сегодня обязанности ехать днём с включённым светом ещё нет."},{"type":"text","text":"# Короткая карта изменений\n- **Велосипеды и СИМ**: шлем, свет и одежда, перевозка детей, сигналы поворота. Подробно: [Велосипеды и самокаты](/useful/izm-velo-sim).\n- **Мотоциклы и мопеды**: шлем, перчатки, обувь, жилет, обочина. Подробно: [Мотоциклы и мопеды](/useful/izm-moto).\n- **Пешеходы**: по какой стороне идти, группы, ночью, переходы. Подробно: [Пешеходы](/useful/izm-peshehody).\n- **Водителям**: обгон, дистанции, аварийный коридор, полосы VAO. Подробно: [Водителям](/useful/izm-voditeli).\n- **Прочее**: ремни, радар-детектор, автодом, парковка, постоянный водитель. Подробно: [Ремни, радар, автодом, парковка](/useful/izm-prochee).\n- **Цифры на одном листе**: [Шпаргалка](/useful/izm-shpargalka)."},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."},{"type":"link","label":"Текст Real Decreto 518/2026 в BOE","url":"https://www.boe.es/buscar/act.php?id=BOE-A-2026-13889","description":"Официальная публикация"}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-obzor');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-velo-sim', '🚲', 'published', 20,
       $j${"ru":"Велосипеды и самокаты: что изменилось","hy":""}$j$::jsonb, $j${"ru":"Шлем за городом, свет и одежда ночью, перевозка детей и грузов, сигналы поворота, движение по полосе.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"text","text":"# Шлем\n- **Велосипедисты за городом**: шлем обязателен всегда. Исключения для затяжного подъёма и медицинской справки, которые действовали до 30 сентября 2026 года, **отменены**.\n- **В городе** взрослому велосипедисту шлем по-прежнему не обязателен, **кроме тех, кто едет по работе** (курьеры на велосипеде или трицикле): им нужен шлем и в городе.\n- **СИМ (электросамокаты)**: сертифицированный и застёгнутый шлем днём и ночью, на любой дороге, где разрешено ездить. Велополоса и малая скорость от шлема не освобождают."},{"type":"text","text":"# Видимость ночью\nВместо обязательной светоотражающей одежды теперь достаточно **одного светящегося или светоотражающего элемента**, соответствующего нормам для средств защиты и видимого со **150 метров**. Подойдёт повязка на руке или фонарь на шлеме. Для СИМ это правило действует и в городе. Свет на самом велосипеде остаётся отдельным требованием."},{"type":"callout","tone":"warn","text":"Свет СИМ днём: обязанность держать приборы включёнными всю поездку, в том числе днём, вступает в силу только **1 октября 2027 года**."},{"type":"text","text":"# Перевозка пассажиров и груза\n- Возить груз или пассажиров на велосипеде вправе только **совершеннолетний**. В 17 лет нельзя даже хорошо закреплённый груз.\n- Ребёнка можно везти в **одобренном дополнительном сиденье**, если он весит **не более 22 кг** и **умеет сидеть самостоятельно**. Прежнего возрастного предела в 7 лет больше нет. Возить можно и на одноместном велосипеде.\n- Вне населённых пунктов перевозка возможна только **днём** и при условиях, не ухудшающих видимость. Ночью за городом ребёнка везти нельзя.\n- Велосипедный прицеп допускается, но его технические требования определит отдельный приказ."},{"type":"image","url":"/new-rules/q31.png","caption":"У светофора с затором велосипедист может проехать в выдвинутую зону ожидания"},{"type":"text","text":"# Движение по улице\n- На городской улице без велополосы велосипедист занимает **центр полосы**, пока это безопасно. Сместиться вправо можно, когда безопасность этого требует.\n- На дорогах с двумя и более полосами в направлении едут по правой, но уйти с неё можно из-за работ, для поворота или по соображениям безопасности.\n- Перед светофором с очередью можно проехать мимо машин (справа или слева) в выдвинутую зону ожидания.\n- Колонной по двое велосипедисты ездят только днём и при хорошей видимости. **Ночью по обочине едут по одному.**\n- Муниципалитет вправе разрешить детям **до 12 лет включительно** ездить по тротуару, если рядом идёт взрослый пешком."},{"type":"image","url":"/new-rules/q28.png","caption":"Велосипедист уходит с правой полосы из-за работ на дороге"},{"type":"text","text":"# Электросамокаты и другие СИМ\n- Минимальный возраст: **15 лет**.\n- Поворот и перестроение: **только рукой**, заранее. Одного указателя уже недостаточно.\n- Вне населённых пунктов СИМ нельзя ездить по автомагистралям и скоростным дорогам, но **велополоса** — исключение, если нет запрещающего знака.\n- Идя рядом с неисправным самокатом, держитесь **правой стороны по ходу движения**.\n- Человек с ограниченной подвижностью, едущий на СИМ со скоростью пешехода, считается **пешеходом**."},{"type":"image","url":"/new-rules/q03.png","caption":"Шлем нужен и на велополосе, и на малой скорости"},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-velo-sim');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-moto', '🏍️', 'published', 30,
       $j${"ru":"Мотоциклы и мопеды: что изменилось","hy":""}$j$::jsonb, $j${"ru":"Шлем без исключений, перчатки только за городом, закрытая обувь, жилет, езда по обочине.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"table","headers":["Экипировка","Где обязательна"],"rows":[["Сертифицированный застёгнутый шлем","Везде, в том числе в городе. Исключение по медсправке отменено"],["Защитные перчатки","Только за городом"],["Закрытая обувь, полностью закрывающая стопу","Везде: сандалии даже с ремешком на пятке не подходят"],["Светоотражающий жилет повышенной видимости","Обязателен в комплектации мотоцикла. За городом надевают, если сошли на дорогу или обочину. Тем, кто ездит по работе, нужен и в городе"]]},{"type":"callout","tone":"warn","text":"С **1 октября 2027 года** шлемы должны быть уже **гомологированными**, а не просто сертифицированными."},{"type":"text","text":"# Обувь и жилет подробнее\nОбувь касается и водителя, и пассажира, и пассажира в коляске. Жилет по работе нужен курьеру на мотоцикле на любой дороге, днём и при хорошей видимости тоже.\n\nЕсли мотоциклист за городом сломался и сошёл на проезжую часть или обочину, он должен надеть жилет, где бы ни остался мотоцикл."},{"type":"text","text":"# Езда по обочине\nМотоциклы вправе ехать по обочине **только на участках, одобренных властями и обозначенных постоянными знаками**. Условия:\n- выезжать можно, когда поток **полностью остановился**; если машины хоть медленно ползут, мотоцикл остаётся в полосе;\n- ехать по одному, не быстрее **30 км/ч**, с повышенной осторожностью.\n\n**Мопеды** по обочине едут тоже по одному, даже если обочина широкая. Колонной по двое могут ехать только велосипедисты, и то днём."},{"type":"image","url":"/new-rules/q45.png","caption":"Мопеды на широкой обочине всё равно едут один за другим"},{"type":"text","text":"# Поворот рядом с велосипедистом\nЕсли водитель мопеда поворачивает направо в другую дорогу, а рядом едет велосипедист, мопед должен **уступить**. Приоритет у велосипедиста, ранний сигнал поворота преимущества не даёт."},{"type":"image","url":"/new-rules/q51.png","caption":"Мопед уступает велосипедисту при повороте"},{"type":"text","text":"# Уязвимые участники\nНа мотоцикле уязвимыми считаются **и водитель, и пассажир**. Это статус, который описывает риск травм, а не возраст или стаж."},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-moto');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-peshehody', '🚶', 'published', 40,
       $j${"ru":"Пешеходы: что изменилось","hy":""}$j$::jsonb, $j${"ru":"Любой тротуар, по обочине в один ряд, ночью с фонарями, приоритет на улицах с единым полотном.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"text","text":"# По какой стороне идти\n- Если есть тротуары с обеих сторон, можно идти **по любому**. Требования идти по правому, как было до 30 сентября 2026 года, больше нет.\n- Если ни тротуара, ни пригодной пешеходной зоны нет, идти нужно **по левой стороне**, в том числе в населённом пункте. По правой — как исключение, когда слева опаснее.\n- Те, кто ведёт велосипед, мопед или СИМ, идут **по правой стороне**.\n- Идти нужно как можно ближе к краю и не мешать движению."},{"type":"text","text":"# Группы пешеходов\n- По обочине и проезжей части группа идёт **в один ряд**, независимо от видимости и интенсивности движения.\n- Ночью и при очень плохой видимости за городом **любая группа** обязана обозначить габарит и положение фонарями. Это относится и к компании друзей без руководителя. Фонари ставят со стороны, обращённой к центру проезжей части."},{"type":"text","text":"# Переходы и приоритет\n- На улицах с **единым полотном** проезжей части и тротуара пешеход имеет приоритет в любой точке проезжей части. Водитель обязан уступить, даже если нет обозначенного перехода.\n- Если на кольце или площади есть оборудованный пешеходный переход, проезжую часть переходят **только по нему**.\n- На переходах с отдельным пешеходным светофором мигающий жёлтый для транспорта не должен совпадать с зелёным для пешеходов.\n- На автомагистралях и скоростных дорогах пешеходам ходить нельзя, и **просить подвезти нельзя нигде на них**, включая площадки пунктов оплаты.\n- Обгон запрещён **на обозначенных пешеходных переходах и рядом с ними** без исключений. Малая скорость и отсутствие людей запрет не снимают."},{"type":"image","url":"/new-rules/q39.png","caption":"Группа велосипедистов — один объект: возвращаться в полосу можно только после последнего"},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-peshehody');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-voditeli', '🚗', 'published', 50,
       $j${"ru":"Водителям: обгон, дистанции, аварийный коридор","hy":""}$j$::jsonb, $j${"ru":"1,5 метра и −20 км/ч, пять метров за велосипедистом, коридор для скорой в пробке, полосы VAO.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"text","text":"# Обгон и объезд уязвимых участников\nПри обгоне **пешеходов, животных, велосипедистов и пользователей СИМ** и при объезде остановившегося на проезжей части транспорта:\n- боковой интервал **не менее 1,5 метра**;\n- вне населённых пунктов скорость **не менее чем на 20 км/ч ниже ограничения** на этой дороге (на дороге с лимитом 90 это 70 км/ч). Отсчёт идёт от лимита, а не от вашей скорости;\n- группа велосипедистов считается **одним объектом**: возвращаться в полосу нельзя через промежуток внутри группы;\n- запрет обгона на участке не распространяется на достаточно медленные СИМ, если манёвр безопасен.\n\nДля обгона **мотоцикла** твёрдого минимума в метрах нет: интервал должен быть достаточным для безопасного манёвра."},{"type":"callout","tone":"warn","text":"За велосипедистом или самокатом на той же полосе держите дистанцию **не менее 5 метров**. Четырёх мало."},{"type":"image","url":"/new-rules/q17.png","caption":"Медленный самокат на участке с запретом обгона: объезжать можно, если это безопасно"},{"type":"text","text":"# Снег на автомагистралях\nПока снег затрудняет движение на автомагистрали или скоростной дороге, **обгон запрещён**. Легковые автомобили едут по правой полосе, если полос две. Левая остаётся для снегоуборщиков и экстренных служб; при трёх и более полосах легковым разрешена ещё и соседняя."},{"type":"image","url":"/new-rules/q14.png","caption":"Снег на скоростной дороге: обгон запрещён, пока он мешает движению"},{"type":"text","text":"# Аварийный коридор\nВ заторе нужно освободить проезд экстренным службам:\n- **две полосы** в направлении: левый ряд прижимается влево, правый вправо, коридор посередине;\n- **три и более**: коридор между крайней левой и соседней полосой. Левый ряд уходит влево, все остальные вправо.\n\nЕсли все уйдут в одну сторону, спецтранспорту проехать негде."},{"type":"image","url":"/new-rules/q07.png","caption":"Две полосы: коридор посередине между рядами"},{"type":"image","url":"/new-rules/q52.png","caption":"Скорая в заторе: ряды расходятся к краям"},{"type":"text","text":"# Полосы VAO\nПолосы для транспорта с высокой загрузкой (VAO) нельзя использовать **легковому автомобилю с прицепом**. Нарушение правил пользования такой полосой считается серьёзным (grave). Один водитель вправе ехать по полосе VAO, если у машины есть знак V-15 или парковочная карта для людей с ограниченной подвижностью. Достаточно одного из двух."},{"type":"text","text":"# Автобусы и обочины\n- Автобус со стоящими пассажирами или без ремней безопасности: **80 км/ч** на любой дороге вне населённых пунктов. Если все сидят пристёгнутыми — 100 км/ч на автомагистралях и скоростных дорогах.\n- Автомобиль дорожной помощи на срочный вызов может ехать по обочине со скоростью **не более 30 км/ч** и с включёнными сигналами."},{"type":"text","text":"# Зоны вокруг больниц\nМеры по снижению скорости и успокоению движения теперь должны вводиться и вокруг **больниц и центров для пожилых людей и людей с инвалидностью**, а не только вокруг школ."},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-voditeli');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-prochee', '🧩', 'published', 60,
       $j${"ru":"Ремни, радар, автодом, парковка","hy":""}$j$::jsonb, $j${"ru":"Кто больше не освобождён от ремня, запрет радар-детекторов, автодом, тарифы парковки, постоянный водитель.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"text","text":"# Ремень безопасности\nОтмена городских исключений: с 1 октября 2026 года **таксисты, развозчики и инструкторы автошколы обязаны быть пристёгнуты**. Без ремня в городе по роду деятельности могут ехать только экстренные службы (скорая, полиция, пожарные) на срочном выезде. Медработник, оказывающий помощь пациенту в салоне скорой, освобождён на любой дороге, потому что должен перемещаться по салону.\n\n**Дети.** Исключение для такси, когда ребёнок ростом до 135 см едет на заднем сиденье без кресла, сохранилось. Обязанность пристегнуться у самого таксиста теперь есть."},{"type":"table","headers":["Кто","Ремень в городе"],"rows":[["Таксист","Обязателен"],["Курьер, развозчик","Обязателен, в том числе при частых остановках"],["Инструктор автошколы","Обязателен весь урок"],["Экстренные службы на срочном выезде","Освобождены"],["Медработник в салоне скорой","Освобождён"]]},{"type":"text","text":"# Радар-детекторы\nЗапрещено **возить** радар-детектор в автомобиле. Выключенный и лежащий в бардачке — всё равно запрещён. Разрешены системы, которые лишь **сообщают, где находятся пункты контроля**."},{"type":"text","text":"# Автодом\nПока автодом стоит, **любые жидкости из жилого отсека** сливать нельзя, даже воду из раковины и даже в решётку. Опираться на дорожное покрытие можно только **шинами**. Клинья под колёса допустимы, а выравнивающие опорные лапы и домкраты — нет."},{"type":"text","text":"# Парковка и регистрация\n- На регулируемой парковке муниципалитет может назначать **разные тарифы по габаритам и экологическому классу автомобиля**, если оба критерия указаны в постановлении.\n- Если владелец автомобиля не имеет прав, он обязан назначить **постоянного водителя** с действующими правами. Обязательность определяется именно отсутствием прав у владельца, а не тем, как часто ездит машина."},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-prochee');

insert into public.useful_pages (section_id, slug, icon, status, sort, title, summary, blocks, published_at)
select (select id from public.useful_sections where title->>'ru' = 'Изменения ПДД с 1.10.26' limit 1), 'izm-shpargalka', '🔢', 'published', 70,
       $j${"ru":"Шпаргалка: все цифры реформы","hy":""}$j$::jsonb, $j${"ru":"Метры, километры, килограммы и даты на одной странице для быстрого повторения перед тестом.","hy":""}$j$::jsonb, $j${"ru":[{"type":"callout","tone":"info","text":"Сверено с текстом Real Decreto 518/2026 от 24 июня (BOE-A-2026-13889) и действующим Reglamento General de Circulación. Если вы читаете это позже, проверьте, не вышли ли новые разъяснения DGT."},{"type":"table","headers":["Что","Значение"],"rows":[["Боковой интервал при обгоне пешехода, животного, велосипеда, СИМ","не менее 1,5 м"],["Снижение скорости вне населённого пункта при таком обгоне и объезде стоящего транспорта","минимум −20 км/ч от лимита дороги"],["Дистанция за велосипедистом или СИМ на той же полосе","не менее 5 м"],["Минимальный возраст водителя СИМ","15 лет"],["Возраст для перевозки груза и пассажиров на велосипеде","18 лет"],["Вес ребёнка в дополнительном сиденье","до 22 кг, умеет сидеть сам"],["Ребёнок на тротуаре на велосипеде с пешим взрослым","до 12 лет включительно"],["Предельная скорость мотоцикла на разрешённой обочине","30 км/ч"],["Машина дорожной помощи по обочине","до 30 км/ч"],["Автобус со стоящими пассажирами или без ремней","80 км/ч"],["Видимость светящегося элемента","150 м"],["Свет СИМ днём","с 1 октября 2027"],["Гомологированные мотошлемы","с 1 октября 2027"]]},{"type":"text","text":"# Самые частые ловушки\n1. Шлем велосипедиста **за городом** обязателен всегда, без справки и без исключения для подъёма.\n2. Мотоциклист: перчатки только за городом, а шлем и закрытая обувь везде.\n3. Таксист, курьер и инструктор больше **не освобождены** от ремня.\n4. Мопеды по обочине ездят **по одному**.\n5. Пешеход по обочине идёт **в один ряд**, а по улице без тротуара — **по левой стороне**.\n6. Радар-детектор запрещён, даже **выключенный**.\n7. Обгон запрещён на пешеходных переходах и около них **всегда**."},{"type":"checklist","title":"Перед тестом проверьте себя","items":["Помню разницу между шлемом в городе и за городом для велосипедиста","Знаю, где ставить аварийный коридор при двух и при трёх полосах","Различаю 1,5 м, 5 м и −20 км/ч","Помню, что вступает в силу только в 2027 году"]},{"type":"text","text":"Закрепите тему на практике: 73 новых вопроса по этим изменениям идут отдельными тестами в самом конце курса. Открыть список: [Тесты](/test)."}],"hy":[]}$j$::jsonb, now()
where not exists (select 1 from public.useful_pages where slug = 'izm-shpargalka');
