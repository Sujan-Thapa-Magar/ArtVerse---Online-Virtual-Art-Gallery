import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { downloadInvoice } from "../utils/generateInvoice";

const API = "http://localhost:8080";
function getToken() { return localStorage.getItem("token"); }

function imgUrl(u) {
  if (!u) return "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80";
  return u.startsWith("http") ? u : `${API}${u}`;
}

const statusCls = {
  delivered:    "bg-green-50 text-green-700 border border-green-200",
  "in-transit": "bg-amber-50 text-amber-700 border border-amber-200",
  pending:      "bg-stone-100 text-stone-500 border border-stone-200",
};

export default function BuyerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Orders");
  const [profile, setProfile]     = useState(null);
  const [orders, setOrders]       = useState([]);
  const [liked, setLiked]         = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [unread, setUnread]       = useState(0);

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [meR,oR,lR,fR,nR] = await Promise.all([
          fetch(`${API}/api/users/me`,{headers}),
          fetch(`${API}/api/orders/my`,{headers}), fetch(`${API}/api/likes/my`,{headers}),
          fetch(`${API}/api/follows/following`,{headers}), fetch(`${API}/api/notifications/unread-count`,{headers}),
        ]);
        const oD=oR.ok?await oR.json():[]; const lD=lR.ok?await lR.json():[]; const fD=fR.ok?await fR.json():[];
        setOrders(oD); setLiked(lD); setFollowing(fD);
        if(nR.ok){const n=await nR.json(); setUnread(n.unreadCount||0);}


        if (meR.ok) {
          setProfile(await meR.json());
        } else {
          setProfile({ name: "User", createdAt: null });
        }
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    })();
  }, []);

  const initials=profile?.name?profile.name.split(" ").map(n=>n[0]).join("").toUpperCase():"?";
  const memberSince=profile?.createdAt?new Date(profile.createdAt).getFullYear():null;
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.pricePaid || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;

  if(loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:"#dc2626",borderTopColor:"transparent"}}/>
        <p className="text-stone-400 text-sm">Loading profile…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-24">

      <Navbar active="profile" />

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8">
        <button
          onClick={() => navigate("/home")}
          className="flex-shrink-0 bg-white border border-stone-200/70 shadow-sm w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-red-600 text-base font-bold hover:bg-red-50 transition-colors mb-4"
        >←</button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 bg-white border border-stone-200/70 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-5">
            <div className="rounded-xl overflow-hidden flex-shrink-0 p-0.5" style={{width:88,height:88,border:"2px solid #dc2626",background:"#fef2f2"}}>
              {profile?.profilePhoto
                ?<img src={`${API}/${profile.profilePhoto}`} alt="avatar" className="w-full h-full object-cover rounded-lg"/>
                :<div className="w-full h-full rounded-lg flex items-center justify-center" style={{background:"#fef2f2"}}>
                  <span style={{fontSize:34,fontWeight:600,color:"#dc2626"}}>{initials[0]}</span>
                </div>}
            </div>
            <div>
              <h1 className="font-display text-stone-900 mb-1" style={{fontSize:"clamp(26px,4vw,36px)",fontWeight:600,margin:"0 0 4px"}}>{profile?.name||"User"}</h1>
              {memberSince&&<p className="text-stone-400 tracking-widest uppercase mb-3" style={{fontSize:9}}>Collector Since {memberSince}</p>}
              <div className="flex gap-2 flex-wrap">
                {orders.length>=5&&<span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded border" style={{borderColor:"#dc2626",color:"#dc2626",background:"#fef2f2",fontSize:9}}>Top Collector</span>}
                {following.length>=3&&<span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-stone-300 text-stone-500 bg-stone-50" style={{fontSize:9}}>Art Enthusiast</span>}
                {orders.length===0 && following.length===0 &&<span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-stone-200 text-stone-400 bg-stone-50" style={{fontSize:9}}>New Collector</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center bg-stone-50/70 rounded-2xl border border-stone-200/70 px-2 py-4 self-start">
            {[{v:orders.length,l:"Purchased"},{v:liked.length,l:"Saved"},{v:following.length,l:"Following"}].map((s,i)=>(
              <div key={s.l} className="flex items-center">
                <div className="text-center px-4 sm:px-6">
                  <span className="tabular-nums block font-bold leading-none" style={{fontSize:"clamp(22px,4vw,28px)",color:"#dc2626"}}>{s.v}</span>
                  <span className="text-stone-400 tracking-widest uppercase mt-1 block" style={{fontSize:9}}>{s.l}</span>
                </div>
                {i<2&&<div className="w-px h-7 bg-stone-200"/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main column ── */}
        <div className="lg:col-span-2">

          {/* Tabs */}
          <div className="border-b border-stone-200 flex overflow-x-auto" style={{scrollbarWidth:"none"}}>
            {["Orders","Saved Items","Following"].map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                className="flex-shrink-0 bg-transparent border-none border-l-0 border-r-0 border-t-0 py-2.5 mr-6 text-sm cursor-pointer transition-all whitespace-nowrap"
                style={{borderBottom:`2px solid ${activeTab===tab?"#dc2626":"transparent"}`,color:activeTab===tab?"#1c1917":"#a8a29e",fontWeight:activeTab===tab?700:400}}>
                {tab}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="pt-6">

            {activeTab==="Orders"&&(
              <div>
                <p className="text-stone-400 tracking-widest uppercase mb-4" style={{fontSize:10}}>{orders.length} Order{orders.length!==1?"s":""}</p>
                {orders.length===0
                  ?<div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-stone-200/70"><span className="text-5xl opacity-20">🖼</span><p className="text-stone-400 text-sm">No orders yet. Start collecting.</p></div>
                  :<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orders.map(order=>(
                      <div key={order.id} className="flex items-start gap-3 sm:gap-4 p-4 bg-white rounded-xl border border-stone-200/70 shadow-sm">
                        <div className="rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200" style={{width:60,height:60}}>
                          <img src={imgUrl(order.artwork.imageUrl)} alt={order.artwork.title} className="w-full h-full object-cover"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 mb-0.5 truncate">{order.artwork.title}</p>
                          <p className="text-xs text-stone-400 mb-2 truncate">{order.artwork.artist.name}</p>
                          <p className="text-xs text-stone-300 uppercase tracking-widest mb-0.5" style={{fontSize:9}}>Price Paid</p>
                          <p className="tabular-nums text-sm font-bold" style={{color:"#dc2626"}}>Rs. {Number(order.pricePaid).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold tracking-widest uppercase px-2 py-1 rounded-full whitespace-nowrap ${statusCls[order.status.toLowerCase().replace("_","-")]||statusCls.pending}`} style={{fontSize:9}}>
                            {order.status.replace("_"," ")}
                          </span>
                          <button
                            onClick={()=>downloadInvoice(order)}
                            className="text-[10px] font-bold tracking-widest uppercase text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer whitespace-nowrap"
                          >
                            ⬇ Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>}
              </div>
            )}

            {activeTab==="Saved Items"&&(
              <div>
                <p className="text-stone-400 tracking-widest uppercase mb-4" style={{fontSize:10}}>{liked.length} Saved Artwork{liked.length!==1?"s":""}</p>
                {liked.length===0
                  ?<div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-stone-200/70"><span className="text-5xl opacity-20">♥</span><p className="text-stone-400 text-sm">No saved artworks yet.</p></div>
                  :<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {liked.map(artwork=>(
                      <a key={artwork.id} href={`/artwork/${artwork.id}`} className="relative block rounded-xl overflow-hidden border border-stone-200/70 bg-white hover:shadow-lg transition-shadow duration-300 group" style={{textDecoration:"none"}}>
                        <div className="overflow-hidden" style={{aspectRatio:"4/3"}}>
                          <img src={imgUrl(artwork.imageUrl)} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        </div>
                        <div className="p-2.5">
                          <p className="text-sm font-semibold text-stone-900 truncate">{artwork.title}</p>
                          <p className="text-xs text-stone-400 truncate">{artwork.artist.name}</p>
                        </div>
                        <span className="absolute top-2 right-2 text-red-500 text-base drop-shadow">♥</span>
                      </a>
                    ))}
                  </div>}
              </div>
            )}

            {activeTab==="Following"&&(
              <div>
                <p className="text-stone-400 tracking-widest uppercase mb-4" style={{fontSize:10}}>Following {following.length} Artist{following.length!==1?"s":""}</p>
                {following.length===0
                  ?<div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-stone-200/70"><span className="text-5xl opacity-20">🎨</span><p className="text-stone-400 text-sm">Not following any artists yet.</p></div>
                  :<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {following.map(artist=>(
                      <div key={artist.id} className="flex items-center gap-3 sm:gap-4 p-3.5 bg-white rounded-xl border border-stone-200/70 shadow-sm">
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-stone-200">
                          {artist.profilePhoto
                            ?<img src={`${API}/${artist.profilePhoto}`} alt={artist.name} className="w-full h-full object-cover"/>
                            :<div className="w-full h-full flex items-center justify-center" style={{background:"#fef2f2"}}>
                              <span style={{fontSize:18,color:"#dc2626",fontWeight:600}}>{artist.name[0].toUpperCase()}</span>
                            </div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900 mb-0.5 truncate">{artist.name}</p>
                          <p className="text-xs text-stone-400 truncate">{artist.bio||"Nepali Artist"}</p>
                        </div>
                      </div>
                    ))}
                  </div>}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Total spent */}
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
            <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400 mb-2">Total Spent</p>
            <p className="tabular-nums text-3xl font-black text-stone-900 leading-none mb-1">Rs. {totalSpent.toLocaleString()}</p>
            <p className="text-xs text-stone-400">across {orders.length} order{orders.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Pending orders */}
          {pendingOrders > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-amber-700 mb-2">Pending Delivery</p>
              <p className="tabular-nums text-3xl font-black text-amber-800 leading-none mb-1">{pendingOrders}</p>
              <p className="text-xs text-amber-700">order{pendingOrders !== 1 ? "s" : ""} awaiting shipment</p>
            </div>
          )}

          {/* Notifications */}
          <a href="/notification" className="block bg-red-600 rounded-2xl shadow-sm p-5 no-underline hover:bg-red-700 transition-colors">
            <p className="text-[9px] font-bold tracking-widest uppercase text-red-100 mb-2">Notifications</p>
            <p className="tabular-nums text-3xl font-black text-white leading-none mb-1">{unread}</p>
            <p className="text-xs text-red-100">{unread === 0 ? "You're all caught up." : "unread — tap to view"}</p>
          </a>
        </div>
      </div>

    </div>
  );
}
