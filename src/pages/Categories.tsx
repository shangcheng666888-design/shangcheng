import type React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import categoryTitleIcon from '../assets/category-icon.png'
import categoryShoujipeijian from '../assets/category-shoujipeijian.png'
import categoryHuwaiyundong from '../assets/category-huwaiyundong.png'
import categoryBangongwenju from '../assets/category-bangongwenju.png'
import categoryXiuxianyuju from '../assets/category-xiuxianyuju.png'
import categoryShumachanpin from '../assets/category-shumachanpin.png'
import categoryLingshitandian from '../assets/category-lingshitandian.png'
import categoryNvshifuzhuang from '../assets/category-nvshifuzhuang.png'
import categoryDiannaopeijian from '../assets/category-diannaopeijian.png'
import categoryZhubaoshoubiao from '../assets/category-zhubaoshoubiao.png'
import categoryErtongwanju from '../assets/category-ertongwanju.png'
import categoryNanshifuzhuang from '../assets/category-nanshifuzhuang.png'
import categoryMeizhuanghufu from '../assets/category-meizhuanghufu.png'
import categoryJujiachugui from '../assets/category-jujiachugui.png'
import categoryYinpijiushui from '../assets/category-yinpijiushui.png'
import categoryLipinka from '../assets/category-lipinka.png'
import categoryFangyiwupin from '../assets/category-fangyiwupin.png'

export interface CategoryCardItem {
  name: string
  image: string
  items: string[]
}

export const CATEGORY_CARDS: CategoryCardItem[] = [
  {
    name: '饮品酒水',
    image: categoryYinpijiushui,
    items: [
      '矿泉水', '果汁', '碳酸饮料', '乳饮', '茶类', '啤酒', '白酒', '鸡尾酒', '葡萄酒',
    ],
  },
  {
    name: '男士服装',
    image: categoryNanshifuzhuang,
    items: [
      '领带', '领结', '男士T恤', '男士衬衫', '男士帽子', '男士内衣和袜子', '男士皮带', '男士皮夹克', '男士上衣', '男士睡衣', '男士外套', '男士西装', '男士下装', '男士鞋子', '男士正装', '眼镜以及配饰', '运动套装', '风衣', '夹克', '帽子', '手套', '围巾', '男士保暖内衣', '男士毛衣', '针织衫外套', '羽绒服',
    ],
  },
  {
    name: '女士服装',
    image: categoryNvshifuzhuang,
    items: [
      '女款衬衫', '女士短裤', '女士帽子', '女士牛仔裤', '女士裙子', '女士上衣', '女士睡衣', '女士外套', '女士西装', '女士鞋子', '女士腰带及皮带', '女士长裤', '袜子', '眼镜和太阳镜', '内衣内裤', '手套', '风衣', '夹克', '帽子', '围巾', '女士保暖内衣', '女士毛衣', '针织衫外套', '羽绒服',
    ],
  },
  {
    name: '零食甜点',
    image: categoryLingshitandian,
    items: ['坚果', '甜点', '蛋糕', '果冻', '面筋', '肉干'],
  },
  {
    name: '手机配件',
    image: categoryShoujipeijian,
    items: [
      '手机壳', '手机膜', '充电器', '数据线', '耳机', '手机支架', '移动电源', '蓝牙耳机', '车载支架', '手机镜头',
    ],
  },
  {
    name: '防疫物品',
    image: categoryFangyiwupin,
    items: [
      '口罩', '消毒液', '洗手液', '体温计', '防护服', '护目镜', '一次性手套', '消毒湿巾', '防护面罩',
    ],
  },
  {
    name: '办公文具',
    image: categoryBangongwenju,
    items: [
      '笔', '本子', '文件夹', '订书机', '胶带', '便签', '剪刀', '尺子', '计算器', '文件袋', '回形针', '订书钉',
    ],
  },
  {
    name: '数码产品',
    image: categoryShumachanpin,
    items: [
      '手机', '平板', '电脑', '相机', '耳机', '音箱', '智能手表', '电子书', '游戏机', '无人机',
    ],
  },
  {
    name: '休闲鱼具',
    image: categoryXiuxianyuju,
    items: [
      '鱼竿', '鱼线', '鱼钩', '鱼饵', '鱼漂', '鱼护', '钓箱', '抄网', '钓椅', '钓鱼服', '鱼竿包',
    ],
  },
  {
    name: '户外运动',
    image: categoryHuwaiyundong,
    items: [
      '帐篷', '睡袋', '登山杖', '运动鞋', '冲锋衣', '户外背包', '露营灯', '防潮垫', '户外炊具', '登山包', '骑行装备',
    ],
  },
  {
    name: '居家橱柜',
    image: categoryJujiachugui,
    items: [
      '橱柜', '收纳盒', '厨房用品', '置物架', '衣柜', '鞋柜', '书架', '储物柜', '抽屉分隔', '收纳袋',
    ],
  },
  {
    name: '美妆护肤',
    image: categoryMeizhuanghufu,
    items: [
      '护肤品', '化妆品', '面膜', '口红', '粉底', '眼影', '睫毛膏', '腮红', '卸妆', '洁面', '精华', '面霜', '防晒',
    ],
  },
  {
    name: '珠宝手表',
    image: categoryZhubaoshoubiao,
    items: [
      '项链', '手链', '手表', '戒指', '耳环', '胸针', '发饰', '皮带表', '智能手环', '珠宝盒',
    ],
  },
  {
    name: '儿童玩具',
    image: categoryErtongwanju,
    items: [
      '积木', '玩偶', '益智玩具', '遥控车', '拼图', '毛绒玩具', '儿童车', '滑板车', '早教玩具', '沙滩玩具',
    ],
  },
  {
    name: '电脑配件',
    image: categoryDiannaopeijian,
    items: [
      '键盘', '鼠标', '显示器', '硬盘', 'U盘', '耳机', '摄像头', '支架', '扩展坞', '键鼠套装', '电脑包',
    ],
  },
  {
    name: '礼品卡',
    image: categoryLipinka,
    items: [
      '电商礼品卡', '游戏点卡', '话费充值卡', '视频会员卡', '咖啡券', '餐饮礼品卡', '超市卡', '通用预付卡',
    ],
  },
]

function translateCategoryName(lang: 'zh' | 'en', name: string): string {
  if (lang === 'zh') return name
  switch (name) {
    case '饮品酒水':
      return 'Beverages & alcohol'
    case '男士服装':
      return "Men's clothing"
    case '女士服装':
      return "Women's clothing"
    case '零食甜点':
      return 'Snacks & desserts'
    case '手机配件':
      return 'Phone accessories'
    case '防疫物品':
      return 'Epidemic supplies'
    case '办公文具':
      return 'Office supplies'
    case '数码产品':
      return 'Digital products'
    case '休闲鱼具':
      return 'Leisure fishing'
    case '户外运动':
      return 'Outdoor sports'
    case '居家橱柜':
      return 'Home & cabinets'
    case '美妆护肤':
      return 'Beauty & skincare'
    case '珠宝手表':
      return 'Jewelry & watches'
    case '儿童玩具':
      return "Kids' toys"
    case '电脑配件':
      return 'Computer accessories'
    case '礼品卡':
      return 'Gift cards'
    default:
      return name
  }
}

export function translateSubcategoryName(lang: 'zh' | 'en', item: string): string {
  if (lang === 'zh') return item
  switch (item) {
    // 饮品酒水
    case '矿泉水':
      return 'Bottled water'
    case '果汁':
      return 'Juice'
    case '碳酸饮料':
      return 'Soft drinks'
    case '乳饮':
      return 'Dairy drinks'
    case '茶类':
      return 'Tea'
    case '啤酒':
      return 'Beer'
    case '白酒':
      return 'Chinese liquor'
    case '鸡尾酒':
      return 'Cocktails'
    case '葡萄酒':
      return 'Wine'

    // 男士服装（只做简要归类，避免过长）
    case '领带':
      return 'Ties'
    case '领结':
      return 'Bow ties'
    case '男士T恤':
      return "Men's T‑shirts"
    case '男士衬衫':
      return "Men's shirts"
    case '男士帽子':
      return "Men's hats"
    case '男士内衣和袜子':
      return "Men's underwear & socks"
    case '男士皮带':
      return "Men's belts"
    case '男士皮夹克':
      return "Men's leather jackets"
    case '男士上衣':
      return "Men's tops"
    case '男士睡衣':
      return "Men's sleepwear"
    case '男士外套':
      return "Men's coats & jackets"
    case '男士西装':
      return "Men's suits"
    case '男士下装':
      return "Men's bottoms"
    case '男士鞋子':
      return "Men's shoes"
    case '男士正装':
      return "Men's formalwear"
    case '眼镜以及配饰':
      return 'Glasses & accessories'
    case '运动套装':
      return 'Tracksuits'
    case '风衣':
      return 'Trench coats'
    case '夹克':
      return 'Jackets'
    case '手套':
      return 'Gloves'
    case '围巾':
      return 'Scarves'
    case '女士保暖内衣':
      return "Women's thermal underwear"
    case '女士毛衣':
      return "Women's sweaters"
    case '男士保暖内衣':
      return "Men's thermal underwear"
    case '男士毛衣':
      return "Men's sweaters"
    case '针织衫外套':
      return 'Knit cardigans'
    case '羽绒服':
      return 'Down jackets'

    // 女士服装（同样做简要翻译）
    case '女款衬衫':
      return "Women's shirts"
    case '女士短裤':
      return "Women's shorts"
    case '女士帽子':
      return "Women's hats"
    case '女士牛仔裤':
      return "Women's jeans"
    case '女士裙子':
      return "Women's skirts"
    case '女士上衣':
      return "Women's tops"
    case '女士睡衣':
      return "Women's sleepwear"
    case '女士外套':
      return "Women's coats & jackets"
    case '女士西装':
      return "Women's suits"
    case '女士鞋子':
      return "Women's shoes"
    case '女士腰带及皮带':
      return "Women's belts"
    case '女士长裤':
      return "Women's trousers"
    case '袜子':
      return 'Socks'
    case '帽子':
      return 'Hats'
    case '眼镜和太阳镜':
      return 'Glasses & sunglasses'
    case '内衣内裤':
      return 'Underwear'

    // 零食甜点
    case '坚果':
      return 'Nuts'
    case '甜点':
      return 'Desserts'
    case '蛋糕':
      return 'Cakes'
    case '果冻':
      return 'Jelly'
    case '面筋':
      return 'Gluten snacks'
    case '肉干':
      return 'Jerky'

    // 手机配件
    case '手机壳':
      return 'Phone cases'
    case '手机膜':
      return 'Screen protectors'
    case '充电器':
      return 'Chargers'
    case '数据线':
      return 'Cables'
    case '耳机':
      return 'Earphones'
    case '手机支架':
      return 'Phone stands'
    case '移动电源':
      return 'Power banks'
    case '蓝牙耳机':
      return 'Bluetooth earphones'
    case '车载支架':
      return 'Car mounts'
    case '手机镜头':
      return 'Phone lenses'

    // 防疫物品
    case '口罩':
      return 'Masks'
    case '消毒液':
      return 'Disinfectant'
    case '洗手液':
      return 'Hand sanitizer'
    case '体温计':
      return 'Thermometers'
    case '防护服':
      return 'Protective suits'
    case '护目镜':
      return 'Goggles'
    case '一次性手套':
      return 'Disposable gloves'
    case '消毒湿巾':
      return 'Disinfectant wipes'
    case '防护面罩':
      return 'Face shields'

    // 办公文具
    case '笔':
      return 'Pens'
    case '本子':
      return 'Notebooks'
    case '文件夹':
      return 'Folders'
    case '订书机':
      return 'Staplers'
    case '胶带':
      return 'Tape'
    case '便签':
      return 'Sticky notes'
    case '剪刀':
      return 'Scissors'
    case '尺子':
      return 'Rulers'
    case '计算器':
      return 'Calculators'
    case '文件袋':
      return 'Document bags'
    case '回形针':
      return 'Paper clips'
    case '订书钉':
      return 'Staples'

    // 数码产品
    case '手机':
      return 'Mobile phones'
    case '平板':
      return 'Tablets'
    case '电脑':
      return 'Computers'
    case '相机':
      return 'Cameras'
    case '音箱':
      return 'Speakers'
    case '智能手表':
      return 'Smartwatches'
    case '电子书':
      return 'E‑readers'
    case '游戏机':
      return 'Game consoles'
    case '无人机':
      return 'Drones'

    // 休闲鱼具
    case '鱼竿':
      return 'Fishing rods'
    case '鱼线':
      return 'Fishing lines'
    case '鱼钩':
      return 'Hooks'
    case '鱼饵':
      return 'Bait'
    case '鱼漂':
      return 'Floats'
    case '鱼护':
      return 'Keep nets'
    case '钓箱':
      return 'Tackle boxes'
    case '抄网':
      return 'Landing nets'
    case '钓椅':
      return 'Fishing chairs'
    case '钓鱼服':
      return 'Fishing clothing'
    case '鱼竿包':
      return 'Rod bags'

    // 户外运动
    case '帐篷':
      return 'Tents'
    case '睡袋':
      return 'Sleeping bags'
    case '登山杖':
      return 'Trekking poles'
    case '运动鞋':
      return 'Sports shoes'
    case '冲锋衣':
      return 'Outdoor jackets'
    case '户外背包':
      return 'Outdoor backpacks'
    case '露营灯':
      return 'Camping lights'
    case '防潮垫':
      return 'Sleeping pads'
    case '户外炊具':
      return 'Outdoor cookware'
    case '登山包':
      return 'Hiking backpacks'
    case '骑行装备':
      return 'Cycling gear'

    // 居家橱柜
    case '橱柜':
      return 'Cabinets'
    case '收纳盒':
      return 'Storage boxes'
    case '厨房用品':
      return 'Kitchenware'
    case '置物架':
      return 'Shelves'
    case '衣柜':
      return 'Wardrobes'
    case '鞋柜':
      return 'Shoe cabinets'
    case '书架':
      return 'Bookshelves'
    case '储物柜':
      return 'Storage cabinets'
    case '抽屉分隔':
      return 'Drawer dividers'
    case '收纳袋':
      return 'Storage bags'

    // 美妆护肤
    case '护肤品':
      return 'Skincare'
    case '化妆品':
      return 'Makeup'
    case '面膜':
      return 'Face masks'
    case '口红':
      return 'Lipsticks'
    case '粉底':
      return 'Foundations'
    case '眼影':
      return 'Eyeshadow'
    case '睫毛膏':
      return 'Mascara'
    case '腮红':
      return 'Blush'
    case '卸妆':
      return 'Makeup remover'
    case '洁面':
      return 'Cleansers'
    case '精华':
      return 'Serums'
    case '面霜':
      return 'Creams'
    case '防晒':
      return 'Sunscreen'

    // 珠宝手表
    case '项链':
      return 'Necklaces'
    case '手链':
      return 'Bracelets'
    case '手表':
      return 'Watches'
    case '戒指':
      return 'Rings'
    case '耳环':
      return 'Earrings'
    case '胸针':
      return 'Brooches'
    case '发饰':
      return 'Hair accessories'
    case '皮带表':
      return 'Leather strap watches'
    case '智能手环':
      return 'Smart bands'
    case '珠宝盒':
      return 'Jewelry boxes'

    // 儿童玩具
    case '积木':
      return 'Building blocks'
    case '玩偶':
      return 'Dolls'
    case '益智玩具':
      return 'Educational toys'
    case '遥控车':
      return 'RC cars'
    case '拼图':
      return 'Puzzles'
    case '毛绒玩具':
      return 'Plush toys'
    case '儿童车':
      return "Kids' ride‑ons"
    case '滑板车':
      return 'Scooters'
    case '早教玩具':
      return 'Early‑learning toys'
    case '沙滩玩具':
      return 'Beach toys'

    // 电脑配件
    case '键盘':
      return 'Keyboards'
    case '鼠标':
      return 'Mice'
    case '显示器':
      return 'Monitors'
    case '硬盘':
      return 'Hard drives'
    case 'U盘':
      return 'USB drives'
    case '摄像头':
      return 'Webcams'
    case '支架':
      return 'Stands & mounts'
    case '扩展坞':
      return 'Docking stations'
    case '键鼠套装':
      return 'Keyboard & mouse sets'
    case '电脑包':
      return 'Laptop bags'

    // 礼品卡
    case '电商礼品卡':
      return 'E‑commerce gift cards'
    case '游戏点卡':
      return 'Game top‑up cards'
    case '话费充值卡':
      return 'Mobile top‑up cards'
    case '视频会员卡':
      return 'Video membership cards'
    case '咖啡券':
      return 'Coffee vouchers'
    case '餐饮礼品卡':
      return 'Dining gift cards'
    case '超市卡':
      return 'Supermarket cards'
    case '通用预付卡':
      return 'General prepaid cards'

    default:
      return item
  }
}

const Categories: React.FC = () => {
  const { lang } = useLang()
  return (
    <div className="page categories-page">
      <div className="categories-page-inner">
        <h1 className="categories-page-title">
          {lang === 'zh' ? '分类' : 'Categories'}
        </h1>
        <div className="categories-card-grid">
          {CATEGORY_CARDS.map((cat) => (
            <div
              key={cat.name}
              className={`category-card${cat.name === '礼品卡' ? ' category-card--lipinka' : ''}`}
            >
              <Link
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="category-card-main"
              >
                <div className="category-card-image-wrap">
                  <img
                    src={cat.image}
                    alt={translateCategoryName(lang, cat.name)}
                    className="category-card-image"
                  />
                </div>
                <h2 className="category-card-title">
                  <span className="category-card-title-inner">
                    <img src={categoryTitleIcon} alt="" aria-hidden="true" className="category-title-icon" />
                    <span className="category-title-text">{translateCategoryName(lang, cat.name)}</span>
                  </span>
                </h2>
              </Link>
              <div className="category-card-body">
                <div className="category-card-items">
                  {cat.items.map((item) => (
                    <Link
                      key={item}
                      to={`/products?category=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(item)}`}
                      className="category-card-item"
                    >
                      {translateSubcategoryName(lang, item)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Categories
