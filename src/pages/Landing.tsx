
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Landing = () => {
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Interactive Chat Demo
    const chatBox = chatBoxRef.current;
    if (chatBox) {
      const messages = [
        { type: 'user', text: "I'm feeling a little overwhelmed lately." },
        { type: 'ai', text: "I hear you. It's okay to feel that way. Can you tell me what's on your mind?" },
        { type: 'user', text: "It's just... everything at once." },
        { type: 'ai', text: "Let's take a deep breath. Together. We can start with just one thing. What feels the heaviest right now?" }
      ];

      let delay = 1000;
      messages.forEach((msg, index) => {
        setTimeout(() => {
          const typingIndicator = chatBox.querySelector('.typing-indicator');
          if(typingIndicator) typingIndicator.remove();
          
          const msgElement = document.createElement('div');
          msgElement.classList.add('chat-message', msg.type === 'user' ? 'user-msg' : 'ai-msg');
          msgElement.textContent = msg.text;
          chatBox.appendChild(msgElement);
          chatBox.scrollTop = chatBox.scrollHeight;

          if (msg.type === 'user' && index < messages.length - 1) {
             setTimeout(() => {
                  const indicator = document.createElement('div');
                  indicator.classList.add('typing-indicator');
                  indicator.innerHTML = '<span></span><span></span><span></span>';
                  chatBox.appendChild(indicator);
                  chatBox.scrollTop = chatBox.scrollHeight;
             }, 800);
          }
        }, delay);
        delay += msg.type === 'user' ? 2000 : 3500;
      });
    }

    // 3D Parallax Card Effect
    const cards = document.querySelectorAll('.mentor-card');
    cards.forEach(card => {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { width, height } = rect;
        const rotateX = (y - height / 2) / (height / 2) * -12;
        const rotateY = (x - width / 2) / (width / 2) * 12;
        (card as HTMLElement).style.transform = `scale(1.05) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };

      const handleMouseLeave = () => {
        (card as HTMLElement).style.transform = 'scale(1.05) rotateX(0deg) rotateY(0deg)';
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    // Scroll Animations
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt((entry.target as HTMLElement).dataset.delay || '0');
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --bg-deep-space: #0d041a;
          --bg-nebula-start: #3d1b63;
          --bg-nebula-end: #1c0b3b;
          --accent-pink: #ff6ac1;
          --accent-cyan: #00f6ff;
          --text-primary: #f0e6ff;
          --text-secondary: #a89bb9;
          --card-bg: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          --card-border: rgba(255, 255, 255, 0.1);
        }

        body {
          font-family: 'Inter', sans-serif !important;
          background-color: var(--bg-deep-space) !important;
          color: var(--text-primary) !important;
          line-height: 1.7;
          overflow-x: hidden;
        }
        
        .aurora-bg {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
          background: radial-gradient(ellipse at 70% 20%, var(--accent-pink) 0%, transparent 50%),
                      radial-gradient(ellipse at 30% 80%, var(--accent-cyan) 0%, transparent 50%),
                      linear-gradient(180deg, var(--bg-nebula-start), var(--bg-deep-space) 80%);
          opacity: 0.2;
          animation: aurora-flow 40s linear infinite;
        }
        @keyframes aurora-flow {
          0% { transform: rotate(0deg) scale(1.5); }
          50% { transform: rotate(180deg) scale(1.5); }
          100% { transform: rotate(360deg) scale(1.5); }
        }

        .container { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; }
        section { padding: 7rem 0; }
        .section-title { font-size: 3rem; font-weight: 700; text-align: center; margin-bottom: 4rem; line-height: 1.2; }
        
        .reveal { opacity: 0; transform: translateY(50px); transition: all 1s cubic-bezier(0.25, 1, 0.5, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) { .reveal { transition: none; } }
        
        header { padding: 1.5rem 0; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 600; }
        .btn-cta {
          background: linear-gradient(90deg, var(--accent-pink), var(--accent-cyan));
          color: #111 !important;
          border: none;
          padding: 0.7rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }
        .btn-cta:hover { 
          transform: scale(1.05) translateY(-2px); 
          box-shadow: 0 10px 20px rgba(0, 246, 255, 0.15);
          color: #111 !important;
        }
        
        .hero-chat {
          padding: 5rem 0; text-align: center; display: flex; flex-direction: column; align-items: center;
        }
        .hero-chat h1 { font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 1.5rem; line-height: 1.2; }
        .hero-chat-box {
          background: var(--card-bg); border: 1px solid var(--card-border);
          width: 100%; max-width: 600px; height: 350px; border-radius: 20px;
          padding: 1.5rem; text-align: left; display: flex; flex-direction: column; gap: 1rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px);
        }
        .chat-message { max-width: 80%; padding: 0.75rem 1.25rem; border-radius: 16px; opacity: 0; animation: fade-in-up 0.5s forwards; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-msg { background-color: rgba(0, 246, 255, 0.1); border-top-right-radius: 4px; align-self: flex-end; color: var(--text-primary); }
        .ai-msg { background-color: rgba(255, 255, 255, 0.08); border-top-left-radius: 4px; align-self: flex-start; color: var(--text-secondary); }
        .typing-indicator { align-self: flex-start; opacity: 0; animation: fade-in-up 0.5s forwards; }
        .typing-indicator span { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: var(--text-secondary); margin: 0 2px; animation: bounce 1s infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        
        .hero-cta-group { margin-top: 2.5rem; }

        .mentors-arena {
          overflow: hidden;
        }

        .mentor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          max-width: 1100px;
          margin: auto;
          gap: 2.5rem;
          justify-content: center;
          perspective: 2000px;
        }

        .mentor-card {
          background: rgba(36, 27, 58, 0.4);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 2.5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transform-style: preserve-3d;
          transition: 
            transform 0.1s linear,
            opacity 0.5s ease,
            filter 0.5s ease;
        }

        .mentor-grid:hover .mentor-card {
          filter: blur(3px);
          opacity: 0.5;
          transform: scale(0.98);
        }

        .mentor-grid:hover .mentor-card:hover {
          filter: blur(0);
          opacity: 1;
          transform: scale(1.05);
          border-color: rgba(255,255,255, 0.2);
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        
        .card-content { transform: translateZ(50px); }

        .mentor-icon-bg {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: grid; place-items: center; z-index: -1;
          opacity: 0.1; transition: opacity 0.4s ease;
        }
        
        .mentor-icon-bg svg { width: 70%; height: 70%; color: var(--text-secondary); transition: transform 0.4s ease; }
        .mentor-card:hover .mentor-icon-bg { opacity: 0.15; }

        .card-jarvis:hover .mentor-icon-bg svg { animation: rotate 20s linear infinite; }
        .card-guru:hover .mentor-icon-bg svg { animation: pulse 4s ease-in-out infinite; }
        .card-vegeta:hover .mentor-icon-bg svg { animation: crackle 0.1s steps(2, end) infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes crackle { 0%{transform:translate(2px,1px) rotate(-1deg)} 20%{transform:translate(-1px,-2px) rotate(-1deg)} 40%{transform:translate(1px,2px) rotate(1deg)} 60%{transform:translate(-2px,1px) rotate(1deg)} 80%{transform:translate(-1px,-1px) rotate(1deg)} 100%{transform:translate(2px,1px) rotate(-1deg)}}

        .mentor-card h3 { font-size: 2.2rem; margin-bottom: 0.5rem; font-weight: 700; }
        .mentor-card .subtitle { color: var(--accent-color); font-weight: 500; margin-bottom: 1.5rem; }
        .card-jarvis { --accent-color: #00f6ff; }
        .card-guru { --accent-color: #abfdec; }
        .card-vegeta { --accent-color: #ffc400; }
        .mentor-card p { color: var(--text-secondary); font-size: 1rem; line-height: 1.6; }
        
        .trust-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 4rem; }
        .trust-visual { 
          text-align: center; 
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .trust-visual img {
          width: 280px;
          height: 320px;
          object-fit: contain;
          filter: drop-shadow(0 0 30px rgba(0, 246, 255, 0.3));
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .trust-content ul { list-style: none; display: flex; flex-direction: column; gap: 1.5rem; }
        .trust-content li { display: flex; align-items: flex-start; gap: 1rem; }
        .trust-content .check-icon { flex-shrink: 0; margin-top: 5px; color: var(--accent-cyan); width: 24px; height: 24px; }
        .trust-content h3 { font-size: 1.25rem; margin-bottom: 0.25rem; }
        .trust-content p { color: var(--text-secondary); }
        
        .testimonial-card {
          background: rgba(13, 4, 26, 0.4); border-left: 4px solid var(--accent-pink);
          padding: 2.5rem; border-radius: 8px; max-width: 700px; margin: 2rem auto;
          backdrop-filter: blur(5px);
        }
        .testimonial-text { font-size: 1.3rem; line-height: 1.6; margin-bottom: 1.5rem; font-weight: 400; }
        .testimonial-author { color: var(--text-secondary); text-align: right; }
        .testimonial-meta { 
          color: var(--text-secondary); 
          text-align: right; 
          font-size: 0.9rem; 
          margin-top: 0.5rem;
          opacity: 0.8;
        }
        
        .final-cta { text-align: center; }
        .final-cta h2 { font-size: 3rem; max-width: 600px; margin: 0 auto 1rem; line-height: 1.3;}
        .final-cta p { color: var(--text-secondary); max-width: 500px; margin: 0 auto 2.5rem; }

        footer { border-top: 1px solid var(--card-border); padding: 3rem 0; text-align: center; color: var(--text-secondary); }
        
        @media (max-width: 1024px) {
          .mentor-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        }
        @media (max-width: 900px) {
          .trust-grid { grid-template-columns: 1fr; }
          .trust-visual { display: none; }
        }
        @media (max-width: 768px) {
          .section-title, .final-cta h2 { font-size: 2.2rem; }
          section { padding: 5rem 0; }
          .testimonial-text { font-size: 1.2rem; }
        }
      `}</style>

      <div className="aurora-bg"></div>
      
      <header className="container reveal">
        <div className="logo">Mantrik</div>
        <Link to="/auth" className="btn-cta">Try Demo</Link>
      </header>

      <main>
        {/* Interactive Hero Section */}
        <section className="hero-chat">
          <h1 className="reveal">A kinder, wiser voice is waiting.</h1>
          <div className="hero-chat-box reveal" data-delay="200" ref={chatBoxRef}>
            {/* Chat messages will be injected here by JavaScript */}
          </div>
          <div className="hero-cta-group reveal" data-delay="400">
            <Link to="/auth" className="btn-cta">Continue this Conversation in the App →</Link>
          </div>
        </section>

        {/* Meet the Mentors Section */}
        <section className="mentors-arena">
          <h2 className="section-title reveal">Meet Your Mentors</h2>
          <div className="mentor-grid">
            {/* Jarvis Card */}
            <div className="mentor-card card-jarvis reveal">
              <div className="mentor-icon-bg">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49 1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                </svg>
              </div>
              <div className="card-content">
                <h3>Jarvis</h3>
                <span className="subtitle">The Analyst</span>
                <p>Deconstructs complexity, identifies core variables, and provides logical pathways to emotional clarity.</p>
              </div>
            </div>

            {/* Calm Guru Card */}
            <div className="mentor-card card-guru reveal" data-delay="200">
              <div className="mentor-icon-bg">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <div className="card-content">
                <h3>Calm Guru</h3>
                <span className="subtitle">The Mystic</span>
                <p>For moments of inner chaos. Provides grounding exercises, meditative guidance, and a space to find your center.</p>
              </div>
            </div>

            {/* Vegeta Card */}
            <div className="mentor-card card-vegeta reveal" data-delay="400">
              <div className="mentor-icon-bg">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                </svg>
              </div>
              <div className="card-content">
                <h3>Vegeta</h3>
                <span className="subtitle">The Overlord</span>
                <p>Tolerates no weakness. Shatter your pathetic excuses, crush your anxieties, and unleash your dormant power.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Trust Sanctuary Section */}
        <section className="trust">
          <div className="container trust-grid">
            <div className="trust-visual reveal">
              <img 
                src="/lovable-uploads/cf9a1544-77e0-481b-8c3f-0542c1776b85.png" 
                alt="Security Shield" 
              />
            </div>
            <div className="trust-content reveal" data-delay="200">
              <h2 style={{textAlign: 'left', fontSize: '2.5rem', marginBottom: '2rem'}}>A Sanctuary For Your Thoughts.</h2>
              <ul>
                <li>
                  <div className="check-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <h3>Absolutely Private</h3>
                    <p>End-to-end encryption means your conversations are for your eyes only. Always.</p>
                  </div>
                </li>
                <li>
                   <div className="check-icon">
                     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                     </svg>
                   </div>
                   <div>
                     <h3>Non-Judgmental Space</h3>
                     <p>Explore your feelings without fear of criticism. Our AI is designed for empathy and support.</p>
                   </div>
                </li>
                <li>
                   <div className="check-icon">
                     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                     </svg>
                   </div>
                   <div>
                     <h3>Data You Control</h3>
                     <p>We believe in data transparency. You have the power to view and delete your history anytime.</p>
                   </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="testimonials">
          <h2 className="section-title reveal">Real People, Real Clarity</h2>
          <div className="testimonial-card reveal">
            <p className="testimonial-text">"I've tried therapy apps before, but Mantrik actually gets it. When I told Jarvis about my work stress, it didn't just give me generic advice - it helped me break down exactly what was triggering my anxiety and gave me concrete steps. Three weeks in and I'm sleeping better."</p>
            <p className="testimonial-author">- Sarah Chen, Product Manager</p>
            <p className="testimonial-meta">Using Mantrik for 2 months</p>
          </div>
           <div className="testimonial-card reveal" data-delay="200">
              <p className="testimonial-text">"As someone who's skeptical of AI, I was hesitant. But during a panic attack at 2 AM, Calm Guru walked me through breathing exercises that actually worked. It felt like having a patient friend who never judges, never gets tired of listening. My therapist even noticed the improvement."</p>
              <p className="testimonial-author">- Marcus Rodriguez, Graduate Student</p>
              <p className="testimonial-meta">Started during finals week, still using daily</p>
          </div>
          <div className="testimonial-card reveal" data-delay="400">
              <p className="testimonial-text">"I was going through a rough divorce and couldn't afford regular therapy sessions. Mantrik became my lifeline. The conversations felt so real that I sometimes forgot I was talking to AI. It helped me process emotions I didn't even know I had."</p>
              <p className="testimonial-author">- Jennifer Park, Teacher</p>
              <p className="testimonial-meta">6 months of daily conversations</p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta">
          <h2 className="reveal">Find Your Clarity Today.</h2>
          <p className="reveal" data-delay="200">Your journey to emotional well-being starts with a single conversation. Download Mantrik and discover a better way to navigate your mind.</p>
          <Link to="/auth" className="btn-cta reveal" data-delay="400">Try Demo (Free)</Link>
        </section>
      </main>

      <footer>
        <div className="container">© 2024 Mantrik Inc. All Rights Reserved.</div>
      </footer>
    </>
  );
};

export default Landing;
