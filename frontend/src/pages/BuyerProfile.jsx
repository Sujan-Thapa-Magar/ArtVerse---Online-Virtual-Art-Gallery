import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { downloadInvoice } from "../utils/generateInvoice";

const API = "http://localhost:8080";
function getToken() { return localStorage.getItem("token"); }
function getCurrentUser() {
  const t = getToken(); if (!t) return null;
  try { return JSON.parse(atob(t.split(".")[1])); } catch { return null; }
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
        const [oR,lR,fR,nR] = await Promise.all([
          fetch(`${API}/api/orders/my`,{headers}), fetch(`${API}/api/likes/my`,{headers}),
          fetch(`${API}/api/follows/following`,{headers}), fetch(`${API}/api/notifications/unread-count`,{headers}),
        ]);
        const oD=oR.ok?await oR.json():[]; const lD=lR.ok?await lR.json():[]; const fD=fR.ok?await fR.json():[];
        setOrders(oD); setLiked(lD); setFollowing(fD);
        if(nR.ok){const n=await nR.json(); setUnread(n.unreadCount||0);}
        if(oD.length>0) setProfile(oD[0].buyer);
        else { const u=getCurrentUser(); setProfile({name:u?.sub||"User",createdAt:null}); }
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    })();
  }, []);

  const handleLogout=()=>{localStorage.removeItem("token");navigate("/login");};
  const initials=profile?.name?profile.name.split(" ").map(n=>n[0]).join("").toUpperCase():"?";
  const memberSince=profile?.createdAt?new Date(profile.createdAt).getFullYear():null;

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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl overflow-hidden flex-shrink-0 p-0.5" style={{width:80,height:80,border:"2px solid #dc2626",background:"#fef2f2"}}>
              {profile?.profilePhoto
                ?<img src={`${API}/${profile.profilePhoto}`} alt="avatar" className="w-full h-full object-cover rounded-lg"/>
                :<div className="w-full h-full rounded-lg flex items-center justify-center" style={{background:"#fef2f2"}}>
                  <span style={{fontFamily:"'Roboto',sans-serif",fontSize:32,fontWeight:600,color:"#dc2626"}}>{initials[0]}</span>
                </div>}
            </div>
            <div>
              <h1 className="text-stone-900 mb-1" style={{fontFamily:"'Roboto',sans-serif",fontSize:"clamp(24px,5vw,32px)",fontWeight:600,margin:"0 0 4px"}}>{profile?.name||"User"}</h1>
              {memberSince&&<p className="text-stone-400 tracking-widest uppercase mb-3" style={{fontSize:9}}>Collector Since {memberSince}</p>}
              <div className="flex gap-2 flex-wrap">
                {orders.length>=5&&<span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded border" style={{borderColor:"#dc2626",color:"#dc2626",background:"#fef2f2",fontSize:9}}>Top Collector</span>}
                {following.length>=3&&<span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-stone-300 text-stone-500 bg-stone-50" style={{fontSize:9}}>Art Enthusiast</span>}
              </div>
            </div>
          </div>

          {/* Stats + Logout */}
          <div className="flex items-center gap-3 self-start">
            <div className="flex items-center bg-white rounded-2xl border border-stone-200 shadow-sm px-2 py-4">
              {[{v:orders.length,l:"Purchased"},{v:liked.length,l:"Saved"},{v:following.length,l:"Following"}].map((s,i)=>(
                <div key={s.l} className="flex items-center">
                  <div className="text-center px-4 sm:px-5">
                    <span className="block font-bold leading-none" style={{fontFamily:"'Roboto',sans-serif",fontSize:"clamp(22px,4vw,28px)",color:"#dc2626"}}>{s.v}</span>
                    <span className="text-stone-400 tracking-widest uppercase mt-1 block" style={{fontSize:9}}>{s.l}</span>
                  </div>
                  {i<2&&<div className="w-px h-7 bg-stone-200"/>}
                </div>
              ))}
            </div>

        
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6 border-b border-stone-200 flex overflow-x-auto" style={{scrollbarWidth:"none"}}>
        {["Orders","Saved Items","Following"].map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            className="flex-shrink-0 bg-transparent border-none border-l-0 border-r-0 border-t-0 py-2.5 mr-6 text-sm cursor-pointer transition-all whitespace-nowrap"
            style={{borderBottom:`2px solid ${activeTab===tab?"#dc2626":"transparent"}`,color:activeTab===tab?"#1c1917":"#a8a29e",fontWeight:activeTab===tab?700:400}}>
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5">

        {activeTab==="Orders"&&(
          <div>
            <p className="text-stone-400 tracking-widest uppercase mb-4" style={{fontSize:10}}>{orders.length} Order{orders.length!==1?"s":""}</p>
            {orders.length===0
              ?<div className="flex flex-col items-center py-16 gap-3"><span className="text-5xl opacity-20">🖼</span><p className="text-stone-400 text-sm">No orders yet. Start collecting.</p></div>
              :orders.map(order=>(
                <div key={order.id} className="flex items-start gap-3 sm:gap-4 py-4 border-b border-stone-100">
                  <div className="rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200" style={{width:60,height:60}}>
                    <img src={order.artwork.imageUrl} alt={order.artwork.title} className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 mb-0.5 truncate">{order.artwork.title}</p>
                    <p className="text-xs text-stone-400 mb-2 truncate">{order.artwork.artist.name}</p>
                    <p className="text-xs text-stone-300 uppercase tracking-widest mb-0.5" style={{fontSize:9}}>Price Paid</p>
                    <p className="text-sm font-bold" style={{color:"#dc2626"}}>Rs. {Number(order.pricePaid).toLocaleString()}</p>
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
          </div>
        )}

        {activeTab==="Saved Items"&&(
          <div>
            <p className="text-stone-400 tracking-widest uppercase mb-4" style={{fontSize:10}}>{liked.length} Saved Artwork{liked.length!==1?"s":""}</p>
            {liked.length===0
              ?<div className="flex flex-col items-center py-16 gap-3"><span className="text-5xl opacity-20">♥</span><p className="text-stone-400 text-sm">No saved artworks yet.</p></div>
              :<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {liked.map(artwork=>(
                  <a key={artwork.id} href={`/artwork/${artwork.id}`} className="relative block rounded-xl overflow-hidden border border-stone-200 bg-white hover:shadow-lg transition-shadow" style={{textDecoration:"none"}}>
                    <div className="overflow-hidden" style={{aspectRatio:"4/3"}}>
                      <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-semibold text-stone-900 truncate" style={{fontFamily:"'Roboto',sans-serif"}}>{artwork.title}</p>
                      <p className="text-xs text-stone-400 truncate">{artwork.artist.name}</p>
                    </div>
                    <span className="absolute top-2 right-2 text-red-500 text-base">♥</span>
                  </a>
                ))}
              </div>}
          </div>
        )}

        {activeTab==="Following"&&(
          <div>
            <p className="text-stone-400 tracking-widest uppercase mb-4" style={{fontSize:10}}>Following {following.length} Artist{following.length!==1?"s":""}</p>
            {following.length===0
              ?<div className="flex flex-col items-center py-16 gap-3"><span className="text-5xl opacity-20">🎨</span><p className="text-stone-400 text-sm">Not following any artists yet.</p></div>
              :following.map(artist=>(
                <div key={artist.id} className="flex items-center gap-3 sm:gap-4 py-3.5 border-b border-stone-100">
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-stone-200">
                    {artist.profilePhoto
                      ?<img src={`${API}/${artist.profilePhoto}`} alt={artist.name} className="w-full h-full object-cover"/>
                      :<div className="w-full h-full flex items-center justify-center" style={{background:"#fef2f2"}}>
                        <span style={{fontFamily:"'Roboto',sans-serif",fontSize:18,color:"#dc2626",fontWeight:600}}>{artist.name[0].toUpperCase()}</span>
                      </div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 mb-0.5 truncate">{artist.name}</p>
                    <p className="text-xs text-stone-400 truncate">{artist.bio||"Nepali Artist"}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}