const PRODUCTS = [
  {
    id:"3cx800a7", name:"Генераторная лампа 3CX800A7", short:"3CX800A7", type:"Радиочастотный узел", group:"rf", image:"lamp-3cx800a7.jpg",
    summary:"Высокомощный триод с воздушным охлаждением. Исполнение показанного изделия определяется по маркировке.",
    specs:[["Тип","Генераторная лампа, триод"],["Охлаждение","Воздушное для типа 3CX800A7"],["Маркировка фото","3CX800A7, Jingguang, China"],["Применимость","Подтверждается по узлу и документации оборудования"]],
    note:"Общие свойства типа не заменяют паспорт конкретной лампы. Производитель на фото отличается от производителя опубликованных справочных данных.",
    source:"MPP MRI product reference"
  },
  {
    id:"3cpx1500a7", name:"Генераторная лампа 3CPX1500A7", short:"3CPX1500A7", type:"Радиочастотный узел", group:"rf", image:"lamp-3cpx1500a7.jpg",
    summary:"Импульсный мощный триод с воздушным охлаждением. Технические параметры сверяются с паспортом конкретной партии.",
    specs:[["Тип","Импульсная генераторная лампа"],["Охлаждение","Воздушное для типа 3CPX1500A7"],["Маркировка фото","3CPX1500A7, Jingguang, China"],["Применимость","Проверяется по модели RF-узла"]],
    note:"Справочные данные по типу лампы не подтверждают электрическую эквивалентность изделия на фото.",
    source:"MPP MRI product reference"
  },
  {
    id:"qch-kit", name:"Philips QCH Kit 1.5T", short:"QCH Kit 1.5T", type:"Комплект для МРТ", group:"cryo", image:"qch-kit.jpg",
    summary:"Комплект Quick Change Head. На фотографии — упаковка и инструкция по сборке; состав набора уточняется по артикулу.",
    specs:[["Наименование","Quick Change Head (QCH) Kit"],["Связанная линейка","Philips Achieva 1.5T — по справочнику Philips"],["Справочный номер","455300071681 — требуется сверка маркировки набора"],["Комплектация","По упаковочному листу конкретного комплекта"]],
    note:"Номер из открытого справочника Philips не считается подтверждённым номером набора на фото до сверки этикетки.",
    source:"Philips QCH reference"
  },
  {
    id:"hc8e", name:"Адсорбер HC-8E", short:"HC-8E", type:"Криосистема", group:"cryo", image:"adsorber-hc8e.jpg",
    summary:"Сменный адсорбер для гелиевого компрессора семейства HC-8. Исполнение проверяется по маркировке.",
    specs:[["Назначение","Адсорбер контура гелиевого компрессора"],["Связанный компрессор","HC-8E"],["Исполнение","Уточняется по этикетке и документации"],["Поставка","Условия согласуются индивидуально"]],
    note:"Фотография предоставлена компанией. Совместимость с конкретным компрессором подтверждается отдельно.",
    source:"SHI cryocooler reference",
    extraImage:"adsorber-pack.jpg"
  },
  {
    id:"titanium-tools", name:"Набор титанового инструмента", short:"Инструменты", type:"Сервисный инструмент", group:"tools", image:"titanium-tools.jpg",
    summary:"Набор ручного инструмента в кейсе. Точный состав и материал подтверждаются спецификацией комплекта.",
    specs:[["Формат","Набор в транспортном кейсе"],["На фото","Ключи, отвёртки, ручной инструмент"],["Материал","Титан — по данным заказчика, требует подтверждения"],["Применение в МР-зоне","Только после проверки документации и допуска"]],
    note:"Фото не подтверждает магнитные свойства инструмента или допуск к работе в МР-зоне.",
    source:"Supplier reference"
  }
];

function productCard(p){return `<article class="product-card" data-group="${p.group}"><a href="product.html?id=${p.id}" aria-label="Подробнее: ${p.name}"><div class="product-image"><img src="assets/${p.image}" alt="${p.name}" loading="lazy"><span class="product-type">${p.type.toUpperCase()}</span></div><div class="product-card-body"><h3>${p.name}</h3><p>${p.summary}</p><div class="product-card-footer"><span>Подробнее о позиции</span><span>↗</span></div></div></a></article>`}
function renderProducts(target,filter="all"){const el=document.getElementById(target);if(!el)return;el.innerHTML=PRODUCTS.filter(p=>filter==="all"||p.group===filter).map(productCard).join("")}
renderProducts("home-products");renderProducts("catalog-products");

document.querySelectorAll(".filter-button").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll(".filter-button").forEach(b=>b.classList.remove("selected"));
  button.classList.add("selected");renderProducts("catalog-products",button.dataset.filter);
}));

if(document.body.dataset.page==="product"){
  const id=new URLSearchParams(location.search).get("id");
  const p=PRODUCTS.find(item=>item.id===id)||PRODUCTS[0];
  document.title=`${p.name} — Здравчасть`;
  document.getElementById("product-breadcrumb").textContent=p.name;
  document.getElementById("product-photo").src=`assets/${p.image}`;
  document.getElementById("product-photo").alt=p.name;
  document.getElementById("product-type").textContent=p.type.toUpperCase();
  document.getElementById("product-name").textContent=p.name;
  document.getElementById("product-lead").textContent=p.summary;
  document.getElementById("product-specs").innerHTML=p.specs.map(([k,v])=>`<div><b>${k}</b><span>${v}</span></div>`).join("");
  document.getElementById("product-note").textContent=p.note;
  if(p.extraImage){const img=document.getElementById("product-extra-photo");img.src=`assets/${p.extraImage}`;img.alt=`Дополнительный вид: ${p.name}`}
  else{document.getElementById("product-extra-photo").src="assets/clinical-visit.jpg";document.getElementById("product-extra-photo").alt="Обсуждение медицинского оборудования"}
}
