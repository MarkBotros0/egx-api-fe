interface ConceptProps {
  id?: string;
  title: string;
  definition: string;
  whyItMatters: string;
  howToUse: string;
}

function Concept({ id, title, definition, whyItMatters, howToUse }: ConceptProps) {
  return (
    <div
      id={id}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-5 scroll-mt-24"
    >
      <h3 className="mb-2 text-sm font-semibold text-accent">{title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-white/70">{definition}</p>
      <div className="space-y-2">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            Why it matters
          </span>
          <p className="text-xs leading-relaxed text-white/50">{whyItMatters}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            How to use it
          </span>
          <p className="text-xs leading-relaxed text-white/50">{howToUse}</p>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} className="group mb-10 scroll-mt-24" open>
      <summary className="mb-4 flex cursor-pointer list-none items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="text-xs text-white/40 group-open:hidden md:hidden">Tap to expand</span>
        <span className="hidden text-xs text-white/40 group-open:inline md:hidden">Tap to collapse</span>
      </summary>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </details>
  );
}

export default function LearnPage() {
  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">
          Learn Stock Market Concepts
        </h1>
        <p className="mb-8 text-sm text-white/40">
          A beginner-friendly guide to understanding the Egyptian stock market.
          Every concept you encounter in this app is explained here.
        </p>

        {/* Market Basics */}
        <Section id="market-basics" title="Market Basics">
          <Concept
            title="What is a Stock?"
            definition="A stock (or share) represents a small piece of ownership in a company. When you buy a stock, you become a partial owner of that company."
            whyItMatters="Stocks are one of the most common ways to invest and grow your money over time. Companies issue stocks to raise money, and investors buy them hoping the price will go up."
            howToUse="Buy stocks of companies you believe will grow in value. You profit when you sell for more than you paid (capital gains) or through dividends (cash payments from the company)."
          />
          <Concept
            title="Order Types"
            definition="A market order buys/sells immediately at the best available price. A limit order buys/sells only at a specific price or better."
            whyItMatters="Using the wrong order type can cost you money. Market orders guarantee execution but not price. Limit orders guarantee price but might not execute if the market doesn't reach your price."
            howToUse="Use market orders when speed matters (you want in or out NOW). Use limit orders when price matters (you'll wait for your target price). On Thndr, you'll choose between these when placing trades."
          />
          <Concept
            title="Bid & Ask"
            definition="The bid is the highest price someone is willing to pay for a stock right now. The ask is the lowest price someone is willing to sell for. The difference is called the 'spread'."
            whyItMatters="The spread is a hidden cost of trading. Wide spreads (common in low-volume EGX stocks) mean you lose money the moment you buy because you'd have to sell at the lower bid price."
            howToUse="Look for stocks with tight spreads (bid and ask are close together). High-volume EGX30 stocks like COMI and TMGH typically have tighter spreads than smaller stocks."
          />
          <Concept
            title="Market Capitalization"
            definition="Market cap = stock price x total number of shares. It tells you the total value the market assigns to the entire company."
            whyItMatters="Market cap helps you understand if a company is large (blue-chip, more stable) or small (more volatile, more growth potential). EGX30 contains Egypt's largest companies by market cap."
            howToUse="Large-cap stocks (EGX30) are good for beginners — they're more liquid and less volatile. Start there before exploring smaller companies."
          />
        </Section>

        {/* Technical Analysis */}
        <Section id="technical-analysis" title="Technical Analysis">
          <Concept
            id="sma"
            title="SMA — Simple Moving Average"
            definition="The average closing price over the last N days. Common periods: 20 days (short-term), 50 days (medium-term), 200 days (long-term)."
            whyItMatters="Smooths out day-to-day noise to reveal the underlying trend. When price crosses above its SMA, it's a bullish signal. When it crosses below, bearish."
            howToUse="On the stock detail page, toggle SMA overlays on the price chart. If the 20-day SMA crosses above the 50-day SMA ('Golden Cross'), many traders see it as a strong buy signal."
          />
          <Concept
            title="EMA — Exponential Moving Average"
            definition="Like SMA but gives more weight to recent prices, so it reacts faster to price changes. The formula uses a multiplier: k = 2/(period+1)."
            whyItMatters="Because it reacts faster than SMA, EMA is better for short-term trading. The MACD indicator is built from EMAs."
            howToUse="Compare EMA 12 and EMA 26 on the chart. When EMA 12 crosses above EMA 26, momentum is turning bullish. This is essentially what MACD measures."
          />
          <Concept
            id="rsi"
            title="RSI — Relative Strength Index"
            definition="A momentum oscillator on a 0-100 scale. Measures the speed and magnitude of recent price changes over 14 periods."
            whyItMatters="RSI > 70 means the stock might be overbought (price rose too fast, may pull back). RSI < 30 means it might be oversold (dropped too much, may bounce). It helps you avoid buying at peaks."
            howToUse="Check the RSI panel on the stock detail page. Don't buy when RSI is above 70. Consider buying when RSI drops below 30 — but only if the company's fundamentals are solid. RSI alone isn't enough."
          />
          <Concept
            title="MACD — Moving Average Convergence Divergence"
            definition="MACD Line = EMA(12) - EMA(26). Signal Line = EMA(9) of the MACD Line. Histogram = MACD Line - Signal Line."
            whyItMatters="MACD is one of the most popular trend-following indicators. It shows both the direction and strength of momentum."
            howToUse="Watch for crossovers: MACD crossing above Signal = bullish, below = bearish. The histogram shows momentum strength — growing bars mean the trend is strengthening."
          />
          <Concept
            title="Bollinger Bands"
            definition="Three lines: Middle = 20-day SMA, Upper = Middle + 2 standard deviations, Lower = Middle - 2 standard deviations. They expand and contract with volatility."
            whyItMatters="When bands squeeze together (low volatility), a big price move is coming — you just don't know which direction. When price touches the upper band, it may be overextended."
            howToUse="Toggle Bollinger Bands on the price chart. Look for 'squeezes' (bands narrowing) as a signal that a breakout is imminent. Combine with RSI to determine direction."
          />
          <Concept
            title="Volume"
            definition="The number of shares traded in a given period. High volume = lots of buying/selling activity."
            whyItMatters="Volume confirms trends. A price rise on high volume is more trustworthy than one on low volume. Low volume moves can easily reverse."
            howToUse="The volume chart below the price chart shows daily trading volume. Green bars = price went up that day, red = price went down. Look for volume spikes as confirmation of breakouts."
          />
        </Section>

        {/* Advanced Technical Indicators */}
        <Section id="advanced-technical-indicators" title="Advanced Technical Indicators">
          <Concept
            id="beta"
            title="Beta"
            definition="Beta measures how much a stock moves relative to the overall market (EGX30). A beta of 1.5 means the stock moves 50% more than the market in both directions."
            whyItMatters="Beta tells you how risky a stock is compared to the market. High-beta stocks (>1.3) amplify market moves — great in bull markets, painful in bear markets. Low-beta stocks (<0.8) are defensive and more stable."
            howToUse="Check the beta value on the stock detail page. If you want a calmer portfolio, pick low-beta stocks. If you believe the market is going up and want to amplify gains, pick high-beta stocks. Example: COMI (banking) often has beta > 1 because banks are sensitive to economic cycles."
          />
          <Concept
            id="golden_death_cross"
            title="Golden Cross / Death Cross"
            definition="A Golden Cross occurs when the 50-day SMA crosses above the 200-day SMA. A Death Cross is the opposite — the 50-day crosses below the 200-day."
            whyItMatters="These are among the most widely-watched signals in technical analysis. A Golden Cross often precedes sustained uptrends. A Death Cross suggests the downtrend may continue. Institutional investors use these as buy/sell triggers."
            howToUse="Look for the Golden/Death Cross badge on the stock detail page. When a Golden Cross occurs, it's a potential entry point. When a Death Cross occurs, consider tightening stop-losses. These signals work best on daily charts with the 50/200 SMA combination."
          />
          <Concept
            id="support_resistance"
            title="Support & Resistance"
            definition="Support is a price level where a stock has repeatedly bounced (buyers step in). Resistance is where it has repeatedly been rejected (sellers take profits). These are shown as horizontal lines on the price chart."
            whyItMatters="Support and resistance levels help you time entries and exits. Buying near support gives you a natural stop-loss point (just below it). Selling near resistance locks in gains before a potential pullback. When a stock breaks through resistance, it often rallies significantly."
            howToUse="On the stock detail page, support levels appear as green dashed lines and resistance as red. The 'strength' number shows how many times the level was tested. A support level tested 5 times is stronger than one tested twice. Set your stop-loss just below a strong support level."
          />
          <Concept
            title="Fibonacci Retracement"
            definition="Fibonacci levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) are derived from the mathematical Fibonacci sequence. They mark potential support/resistance levels between a recent high and low."
            whyItMatters="The 61.8% level (the 'golden ratio') is considered the strongest retracement level. Many traders watch Fibonacci levels for entry points during pullbacks in an uptrend."
            howToUse="Fibonacci levels appear as gold dashed lines on the price chart. In an uptrend, if the price pulls back to the 38.2% or 61.8% level and bounces, it's often a good entry point. If it falls below the 78.6% level, the uptrend may be over."
          />
          <Concept
            id="atr"
            title="ATR — Average True Range"
            definition="ATR measures the average daily price movement (including gaps), calculated over the last 14 days. If ATR is 3.5 EGP, the stock typically moves 3.5 EGP per day."
            whyItMatters="ATR is essential for setting stop-losses. Setting a stop-loss within 1x ATR means you'll likely get stopped out by normal price noise. A stop-loss at 1.5-2x ATR gives the trade room to breathe."
            howToUse="Check the ATR value in the stats panel. Set your stop-loss at least 1.5x ATR below your entry price. Example: if you buy at 100 EGP and ATR is 4 EGP, set your stop at 94 EGP (100 - 1.5 × 4). The advice panel will suggest specific stop-loss distances based on ATR."
          />
          <Concept
            id="obv"
            title="OBV — On-Balance Volume"
            definition="On-Balance Volume adds volume on up days and subtracts it on down days. It creates a cumulative total that shows whether money is flowing into or out of a stock."
            whyItMatters="OBV confirms price trends. If price is rising AND OBV is rising, the uptrend is healthy (confirmed by volume). If price is rising but OBV is falling, the rally may be fake — not enough buyers to sustain it (divergence)."
            howToUse="Check the OBV tab in the indicators panel. The most important signal is divergence: when OBV moves in the opposite direction of price. Bullish divergence (price falling, OBV rising) can signal a reversal is coming."
          />
          <Concept
            title="Volume-Price Confirmation"
            definition="Volume-price confirmation classifies whether current volume backs up the direction of price movement. Classifications include: Confirmed Up (price rising with high volume — strong buy pressure), Confirmed Down (price falling with high volume — strong selling), Unconfirmed Up (price rising on low volume — weak rally), Accumulation (price barely moving but volume high — smart money quietly buying)."
            whyItMatters="Price moves mean very little without volume context. A 5% rally on normal volume is exciting; a 5% rally on 3x normal volume is a confirmation that major buyers are stepping in. Conversely, an unconfirmed rally is a warning that retail traders are chasing with no institutional support — it often reverses."
            howToUse="The Volume Trend field on portfolio holdings and the volume-price classification on the stock detail page tell you the current state. 'Accumulation' is particularly interesting — it often precedes a significant price increase as whatever entity was quietly accumulating begins to push the price up. 'Unconfirmed Up' is a yellow flag — consider waiting before buying into the rally."
          />
          <Concept
            id="multi_timeframe"
            title="Multi-Timeframe Analysis"
            definition="Multi-timeframe analysis compares signals on different chart intervals (e.g., Daily and Weekly) to determine if a trend is genuine or just short-term noise. When both timeframes agree, the signal is much stronger."
            whyItMatters="A stock that looks bullish on a daily chart may actually be in a downtrend on the weekly chart — you'd be buying a temporary bounce inside a larger decline. When daily and weekly trends align (both bullish or both bearish), the probability of success is significantly higher."
            howToUse="Look for the alignment badge on the stock detail page (e.g., 'Daily + Weekly aligned (bullish)'). When you see this, any buy signal from RSI, MACD, or ADX is more reliable. When you see 'Daily bullish vs Weekly bearish — mixed signals', be cautious: you may be trading against the larger trend. Reduce position size or wait for the weekly trend to turn."
          />
          <Concept
            id="stochastic"
            title="Stochastic Oscillator"
            definition="The Stochastic Oscillator compares a stock's closing price to its price range over 14 days. It has two lines: %K (fast) and %D (slow signal), both ranging from 0 to 100."
            whyItMatters="Like RSI, it identifies overbought (>80) and oversold (<20) conditions. The key signal is the crossover: when %K crosses above %D from below 20, it's a buy signal. When %K crosses below %D from above 80, it's a sell signal."
            howToUse="Check the Stochastic tab in the indicators panel. The strongest buy signals come when: (1) both lines are below 20, (2) %K crosses above %D, and (3) the price is near a support level. This triple confirmation gives higher-probability entries."
          />
          <Concept
            id="adx"
            title="ADX — Average Directional Index"
            definition="ADX measures trend strength on a 0-100 scale, regardless of direction. It also comes with two companion lines: DI+ (buying pressure) and DI- (selling pressure). ADX above 25 indicates a strong trend; below 20 means the market is ranging (no clear trend)."
            whyItMatters="Many traders buy breakouts only to get burned when the move fades quickly. ADX tells you if a trend has enough strength to sustain itself. High ADX means the current trend — up or down — is powerful and likely to continue."
            howToUse="Use ADX as a filter: only trade momentum signals (like RSI oversold or MACD crossover) when ADX is above 25. When DI+ is above DI-, buyers are dominant — look for long entries. When DI- is above DI+, sellers are in control — be cautious. Ignore signals when ADX is below 20; the market is just noise."
          />
          <Concept
            id="mfi"
            title="MFI — Money Flow Index"
            definition="MFI is a volume-weighted RSI that combines price movement and trading volume to show whether money is flowing into or out of a stock. It ranges from 0 to 100. Above 80 = overbought, below 20 = oversold."
            whyItMatters="MFI is harder to fake than RSI because it requires volume confirmation. A stock can briefly spike in price on low volume (RSI might look overbought), but MFI won't confirm unless real buying pressure (volume) backs the move."
            howToUse="Use MFI alongside RSI for higher-conviction signals. If both RSI and MFI are below 20 simultaneously, the oversold signal is very strong. MFI divergence is especially powerful: if price makes a new high but MFI makes a lower high, selling pressure is growing even though price looks strong — consider reducing your position."
          />
          <Concept
            id="divergence"
            title="Divergence"
            definition="Divergence happens when price and an indicator move in opposite directions. Bullish divergence: price makes a lower low but the indicator (RSI/MACD) makes a higher low — momentum is building, reversal may be near. Bearish divergence: price makes a higher high but the indicator makes a lower high — rally is weakening."
            whyItMatters="Divergence is one of the most reliable early warning signs in technical analysis. It shows that the current trend is losing the fuel that was driving it, even before the price reverses. Institutional traders watch divergences carefully."
            howToUse="On the stock detail page, look for the divergence badges below the score card (e.g., 'RSI bullish divergence'). Bullish divergence after a significant drop is a high-probability setup, especially if RSI is below 30 when it occurs. Don't act on divergence alone — wait for price confirmation (a close above a recent swing high, for example)."
          />
          <Concept
            title="Bollinger Squeeze"
            definition="A Bollinger Squeeze occurs when the bands narrow significantly — typically when current bandwidth falls below 70% of its 6-month average. It signals a period of unusually low volatility, which historically precedes a large directional move."
            whyItMatters="Markets alternate between low-volatility (contraction) and high-volatility (expansion) phases. When the Bollinger Bands squeeze tightly, energy is building for a breakout. The squeeze itself doesn't tell you which direction, but it tells you a big move is imminent."
            howToUse="Watch for the 'Bollinger squeeze — breakout likely' badge on the stock detail page. When you see it, check ADX (is a trend forming?), RSI (momentum direction?), and MACD (crossing?). These indicators help determine which direction the breakout is likely to go. Enter only when the price actually breaks out of the squeeze zone, not before."
          />
        </Section>

        {/* Composite Score */}
        <Section id="composite-score" title="Composite Score">
          <Concept
            id="composite_score"
            title="What is the Composite Score?"
            definition="The Composite Score is a single 0–100 number that blends EIGHT technical categories — Trend, Momentum, Volume, Volatility, Divergence, Quality, Risk-Adjusted, and Relative Strength — into one glanceable signal. Scores translate to signals: 0–20 Strong Sell, 21–40 Sell, 41–60 Hold, 61–80 Buy, 81–100 Strong Buy. A macro modulation is then applied on top: scores get dampened when the overall market (EGX30) is in a bearish regime."
            whyItMatters="Looking at 20+ indicators individually and reaching a coherent conclusion is hard, especially for new investors. The composite score does this blending for you and factors in whether your stock is actually beating the Egyptian T-bill rate, whether it's leading the market, and whether the broader EGX30 trend supports buying. It turns complex data into one actionable read."
            howToUse="Find the composite score on every stock detail page (the circular gauge at the top), on portfolio holding rows, and as an average across your whole portfolio. Use it as a first filter: only research stocks scoring above 60 (Buy) if you are looking for longs. Use it as a quick health check: a portfolio average below 40 means most of your holdings have deteriorating technicals."
          />
          <Concept
            title="The Eight Score Categories"
            definition="Trend: price vs SMAs, ADX, golden/death cross. Momentum: RSI, MACD, Stochastic. Volume: OBV, MFI, volume-price confirmation. Volatility: Bollinger Bands position and squeeze. Divergence: RSI/MACD divergence vs price. Quality: trend consistency + multi-timeframe alignment + drawdown depth. Risk-Adjusted: annualized return vs the 25% T-bill + ATR context. Relative Strength: alpha vs the EGX30 over 30 days."
            whyItMatters="The three newer categories — Quality, Risk-Adjusted, and Relative Strength — address the three most expensive beginner mistakes: (1) chasing choppy stocks whose trends flip weekly, (2) holding stocks that underperform cash, and (3) holding market laggards. Each category captures a different dimension; the score is only as confident as the agreement across them."
            howToUse="Tap any category bar in the Score Breakdown to expand its reasons list — plain-language explanations of exactly what's contributing positively or negatively. A stock scoring 70 with all 8 categories contributing is much stronger than a 70 where only 2 categories scored high. Watch for 'N/A' categories on freshly-listed stocks — Risk-Adjusted requires at least 120 days of history."
          />
          <Concept
            id="risk_adjusted_return"
            title="Risk-Adjusted Return — Beating the T-Bill"
            definition="This category compares a stock's annualized return to the Egyptian T-bill rate (~25%). A stock returning 20% annualized is losing you money vs holding risk-free cash. The category also penalises extreme volatility and wide ATR relative to price, both of which eat into real returns."
            whyItMatters="Egypt's T-bill rate is the HIGHEST risk-free rate of any major market. In the US, stocks returning 10% easily beat a 4% T-bill. In Egypt, a 20% stock return is actually a LOSS vs cash. Without this category, the composite would happily give 'Buy' signals to mediocre performers that aren't worth the risk."
            howToUse="If Risk-Adjusted is red on a stock you own, seriously ask whether the thesis still justifies the risk over T-bills. If it's green, the stock is pulling its weight. Beginner tip: the 'Income / Defensive' preset weights this category heavily — great if your first priority is protecting capital."
          />
          <Concept
            id="relative_strength"
            title="Relative Strength — Leaders vs Laggards"
            definition="Compares a stock's 30-day return to the EGX30 benchmark. Alpha > +5% = leader; Alpha < -10% = laggard; in-between = tracking the market. Stocks that lead tend to keep leading for weeks; laggards tend to keep lagging."
            whyItMatters="In any market, roughly half the stocks underperform the index. A huge class of beginner losses comes from buying laggards that 'look cheap'. If you can't beat EGX30, you should own EGX30 (via an index fund) instead of individual picks."
            howToUse="Before buying any stock, check Relative Strength. If it's a laggard, you need a very specific thesis (e.g., a turnaround catalyst) to justify the purchase. For existing holdings, persistent laggards are candidates for replacement — consider switching to a leader in the same sector."
          />
          <Concept
            title="Quality — Clean Trends and Recovery"
            definition="Quality rewards stocks whose trends are SMOOTH (few whipsaws), whose daily and weekly timeframes agree, and which aren't stuck deep in a drawdown. Technically the category combines: fraction of last 20 days closing above the 20-day SMA, multi-timeframe alignment, and current drawdown depth."
            whyItMatters="Choppy stocks are where over-trading losses come from. A stock flipping between +3% and -3% daily will generate constant buy/sell signals and drain you in transaction costs and emotional stress. Clean trends are 'investable'; choppy stocks are traps for beginners."
            howToUse="If Quality is red but Trend is green, you're looking at a stock that recently turned — but its history is messy. Wait for a few weeks of clean trending before committing capital. The Quality category is heavily weighted in the default 'Beginner Safe' preset for exactly this reason."
          />
          <Concept
            title="Macro Modulation"
            definition="After the 8 categories are weighted and summed, a macro adjustment is applied based on the EGX30 trend. If EGX30 is bullish, no change. If sideways, bullish scores are gently dampened and bearish reinforced. If bearish, the effect is stronger (±15%). The adjustment is shown as a +/− number beneath the gauge."
            whyItMatters="The #1 piece of market wisdom: 'Don't fight the tape.' Individual stocks rise and fall with the broader market ~70% of the time. A technically perfect stock in a bear market still tends to fall. Macro modulation prevents the composite from confidently signalling 'Buy' into a falling market."
            howToUse="In a bearish EGX30 regime, demand higher scores before buying — the bar rises. Conversely, scores below 30 are amplified (fall faster), giving more conviction on exits. Watch the macro adjustment on the Score Breakdown card: a -8 adjustment means the raw technicals were actually 8 points higher; the market is pulling them down."
          />
          <Concept
            title="Customizing Weights — Presets"
            definition="Five presets tailor the blend. Beginner Safe (default): balances all 8 categories with heavier weight on Quality and Risk-Adjusted. Balanced: even split across 8. Trend Follower: heavy on Trend + Quality + Relative Strength. Reversal Hunter: heavy on Divergence and Momentum. Income / Defensive: prioritises Risk-Adjusted and Quality (for capital preservation)."
            whyItMatters="Different goals need different blends. A first-time investor should use 'Beginner Safe' — it won't tell you to buy choppy, cash-underperforming stocks. A seasoned trader looking for reversals wants 'Reversal Hunter'. An investor trying to beat T-bills uses 'Income / Defensive'."
            howToUse="Start with 'Beginner Safe'. After a month, if you find the signals too conservative (missing momentum moves), try 'Trend Follower'. If T-bills feel more attractive than your picks, try 'Income / Defensive'. Weights are saved and immediately recalculate all scores across the app."
          />
          <Concept
            title="Composite Score Limitations"
            definition="The Composite Score is an educational tool built on technical indicators plus macro context. It does not factor in company fundamentals (earnings, debt, management), news events, or geopolitical risk. A technically perfect stock can still fall if bad news hits."
            whyItMatters="No single number can capture everything. A score of 85 (Strong Buy) means the technical + macro setup is favourable — not that you're guaranteed to profit. The score has no knowledge of upcoming earnings, regulatory changes, or war headlines that could override any technical signal instantly."
            howToUse="Use the score as one input in a broader decision process: (1) Is the technical score ≥ 60? (2) Are fundamentals reasonable? (3) Is the macro environment supportive? (4) Is position sizing appropriate? All four boxes should ideally be checked before taking a position. See 'How to Take a Decision' below for the step-by-step framework."
          />
        </Section>

        {/* Decision Framework — the canonical step-by-step for beginners */}
        <Section id="decision-framework" title="How to Take a Decision (Beginner Framework)">
          <Concept
            id="decision_step_macro"
            title="Step 1 — Check the Macro"
            definition="Look at the MacroCard on your portfolio page. What is the EGX30 trend? What is the USD/EGP doing? What is the CBE interest rate? This is the 'weather report' before you go outside."
            whyItMatters="Individual stocks rise and fall with the market most of the time. Buying anything in a strong bear market — even a technically perfect stock — has a poor expected outcome. The composite score's macro adjustment already bakes this in, but you should understand it consciously too."
            howToUse="If EGX30 is bearish, raise your bar. Instead of buying at Composite ≥ 60, wait for ≥ 70. In a sideways market, tighten position sizes. In a bullish macro, you can be more aggressive."
          />
          <Concept
            id="decision_step_score"
            title="Step 2 — Check the Composite Score"
            definition="Open the stock detail page. Is the Composite ≥ 60 (Buy) or ≥ 80 (Strong Buy)? Which categories are driving the score? Expand each category bar and read the reasons."
            whyItMatters="If the score is below 60, the technical setup is not in your favour. Starting with a weak setup means you're fighting the market — even if the stock is a great long-term story, short-term it's likely to fall further."
            howToUse="Only proceed to Step 3 if the score is ≥ 60. If it's between 50 and 60, add the stock to your Watchlist and revisit weekly. If it's below 40, this is actively a SELL candidate, not a buy."
          />
          <Concept
            id="decision_step_risk"
            title="Step 3 — Does It Beat T-Bills?"
            definition="Look at the Risk-Adjusted category specifically. Is the annualized return comfortably above the ~25% T-bill rate? The reasons list will tell you the exact numbers."
            whyItMatters="Egypt's risk-free rate is unusually high. A stock returning 22% annualized is LOSING real money vs cash. This single filter eliminates a huge class of low-quality opportunities."
            howToUse="If Risk-Adjusted is red or missing (insufficient history), be very sceptical. The stock either underperforms cash or we can't tell. For beginners, the 'Income / Defensive' preset makes this the dominant factor — consider switching to it."
          />
          <Concept
            id="decision_step_leader"
            title="Step 4 — Is It a Market Leader?"
            definition="Check the Relative Strength category. Is the stock outperforming EGX30 over the last 30 days (leader) or underperforming (laggard)?"
            whyItMatters="Leaders tend to keep leading, laggards tend to keep lagging. Buying a laggard because 'it looks cheap' is a classic beginner trap — it's cheap for a reason, usually because institutional money has been leaving."
            howToUse="If the stock is a laggard, you need a very specific catalyst (e.g., upcoming earnings, new contract) to justify buying. Otherwise, find a leader in the same sector. If Relative Strength is green, proceed."
          />
          <Concept
            id="decision_step_stop"
            title="Step 5 — Set Your Stop-Loss BEFORE Buying"
            definition="Decide the exact price at which you'll exit if the trade goes against you. Use the ATR suggestion from the advice panel: set stop 1.5–2x ATR below entry. Enter this stop-loss value when adding the stock to your portfolio."
            whyItMatters="Without a stop-loss, small losses become catastrophic. You MUST decide your exit plan before you buy — because after you buy, emotions (hope, fear) will override logic. A pre-committed stop-loss protects you from yourself."
            howToUse="Example: buying at 100 EGP, ATR is 3 EGP → stop-loss at 94-95 EGP (about 5% below). Accept that you may get stopped out by normal volatility; that's fine. A stopped-out small loss is much better than a no-stop catastrophic loss."
          />
          <Concept
            id="decision_step_size"
            title="Step 6 — Size the Position Correctly"
            definition="Never put more than 5–10% of your portfolio into a single stock. If the stock is a new, thin-liquidity name (NILEX), cap it at 2–3%. The diversification score on your portfolio page will warn you if you exceed these limits."
            whyItMatters="A 50% drop on a stock that's 20% of your portfolio is a 10% portfolio hit. A 50% drop on a stock that's 5% of your portfolio is a 2.5% hit — survivable, recoverable. Position sizing is the single biggest determinant of long-term survival."
            howToUse="Divide your portfolio into ~10 slots. Each stock gets one slot. If a position grows to 15%+ due to gains, consider trimming it back to 10%. Diversification is boring but it's the closest thing to a free lunch in investing."
          />
        </Section>

        {/* Risk Management */}
        <Section id="risk-management" title="Risk Management">
          <Concept
            id="stop_loss"
            title="Stop-Loss"
            definition="A pre-set price at which you'll sell a stock to limit your losses. For example, buying at 100 EGP with a stop-loss at 90 EGP means you'll accept a maximum 10% loss."
            whyItMatters="Without a stop-loss, a small loss can become a catastrophic one. The #1 rule of investing: protect your capital. You can always buy back, but you can't invest money you've lost."
            howToUse="When adding a stock to your portfolio in this app, set a stop-loss. A common rule: set it at 7-10% below your buy price. Review it regularly."
          />
          <Concept
            title="Position Sizing"
            definition="How much of your total portfolio you allocate to a single stock. If your portfolio is 100,000 EGP and you buy 10,000 EGP of COMI, your position size is 10%."
            whyItMatters="Never put all your money in one stock. If that stock drops 50%, you lose 50% of everything. But if it's only 10% of your portfolio, you only lose 5% overall."
            howToUse="The portfolio page shows your stock concentration. Keep any single position below 20-25% of your total portfolio. The diversification score penalizes concentration."
          />
          <Concept
            title="Diversification"
            definition="Spreading your investments across different stocks, sectors, and asset types to reduce risk."
            whyItMatters="Different sectors react differently to economic events. If you own only bank stocks and banking regulations change, your entire portfolio suffers. Diversification protects against this."
            howToUse="The portfolio page shows sector allocation. Aim for exposure across 3-5 sectors. The diversification score on your portfolio page helps you track this."
          />
          <Concept
            title="Max Drawdown"
            definition="The largest peak-to-trough decline in a stock or portfolio's value. If a stock went from 100 to 80 to 120, the max drawdown was -20%."
            whyItMatters="Shows the worst-case scenario. Even if a stock has great returns overall, a -40% drawdown means at some point you'd have watched 40% of your investment disappear. Can you stomach that?"
            howToUse="Check max drawdown on the Compare page when evaluating stocks. Compare it to your risk tolerance. If you'd panic at a 20% loss, avoid stocks with max drawdowns worse than -20%."
          />
          <Concept
            id="liquidity"
            title="Liquidity — Can You Get Out?"
            definition="Liquidity measures how easily you can buy or sell a stock without moving its price. Measured by average daily volume. EGX30 stocks typically trade millions of shares/day; NILEX stocks might trade a few thousand."
            whyItMatters="Thin liquidity is a beginner trap. In a panic, illiquid stocks have no bid — you may literally be unable to sell at any reasonable price. Wide bid/ask spreads also cost you real money on every trade (sometimes 2-3% round-trip)."
            howToUse="The app warns you when a stock has thin volume (index-aware: a NILEX stock isn't expected to trade like COMI). If you see the 'low liquidity' warning, keep position size tiny (≤ 2% of portfolio) and use limit orders only. Prefer EGX30/EGX70 names for core positions."
          />
          <Concept
            id="cash_underperformer"
            title="The Cash Underperformer Trap"
            definition="A 'cash underperformer' is a stock you've held for 90+ days whose annualized return is below the T-bill rate (~25%). You're literally earning less than risk-free cash — while taking stock-market risk."
            whyItMatters="This is THE #1 invisible loss in Egyptian retail portfolios. A stock that gained 10% in a year feels like a win, but if T-bills paid 25%, you're 15% behind where you could have been with zero risk. Over years, this compounds into life-changing differences."
            howToUse="The portfolio page flags cash underperformers with a warning signal. When you see one: (1) does the thesis still hold for the next 90 days? (2) is there a specific catalyst coming? If no on both, seriously consider selling and moving the capital to T-bills until a better opportunity presents itself."
          />
        </Section>

        {/* Portfolio Risk Metrics */}
        <Section id="portfolio-risk-metrics" title="Portfolio Risk Metrics">
          <Concept
            id="sharpe_ratio"
            title="Sharpe Ratio"
            definition="The Sharpe ratio measures risk-adjusted return: how much excess return you earn per unit of risk. Formula: (portfolio return - risk-free rate) / portfolio volatility."
            whyItMatters="A positive Sharpe means your portfolio beats the risk-free rate (Egyptian T-bills at ~25%). Below 0 means you'd literally earn more with zero risk in T-bills. Above 1.0 is excellent. Note: Egypt's high T-bill rate makes it harder for stocks to have a positive Sharpe."
            howToUse="Check your portfolio's Sharpe ratio on the Risk Dashboard. If it's negative, your stock picks are underperforming guaranteed T-bill returns — consider whether your positions still make sense. A Sharpe of 0.5 in Egypt is actually quite respectable given the high risk-free rate."
          />
          <Concept
            title="Sortino Ratio"
            definition="Like the Sharpe ratio, but only penalizes downside volatility (losses). It ignores upside volatility (big gains), which is actually desirable."
            whyItMatters="The Sortino ratio is fairer than Sharpe for stocks with large upside swings. If a stock has occasional big jumps upward, Sharpe penalizes that volatility, but Sortino doesn't."
            howToUse="Compare your Sortino to your Sharpe. If Sortino is significantly higher, it means your portfolio's volatility is mostly on the upside (good). If they're similar, risk is evenly distributed."
          />
          <Concept
            title="Value at Risk (VaR) & CVaR"
            definition="VaR (95%) tells you: 'On 95% of days, your portfolio won't lose more than X EGP.' CVaR (Conditional VaR) goes further: 'On the worst 5% of days, your average loss would be Y EGP.'"
            whyItMatters="VaR gives you a concrete number for how much you could lose on a bad day. It helps you decide if your position sizes are appropriate for your risk tolerance."
            howToUse="Check your daily VaR on the Risk Dashboard. If the number makes you uncomfortable, reduce position sizes or diversify more. Example: if your VaR is 5,000 EGP and you can't afford to lose that on any given day, you're overexposed."
          />
          <Concept
            id="correlation"
            title="Correlation & Diversification"
            definition="Correlation measures how two stocks move together. +1 means they move identically, -1 means they move in opposite directions, 0 means no relationship."
            whyItMatters="True diversification requires holding stocks that DON'T move together. If all your stocks are highly correlated (>0.7), your portfolio has concentrated risk — when one drops, they all drop. Negative correlation is ideal for risk reduction."
            howToUse="Check the Correlation Matrix on your portfolio page. If you see pairs with correlation >0.7, consider replacing one with a stock from a different sector. For example: don't hold 3 bank stocks — they'll all drop together when banking regulations change."
          />
          <Concept
            title="Monte Carlo Simulation"
            definition="Monte Carlo runs 1,000 random simulations of your portfolio's future based on its historical return and volatility patterns. It shows the range of possible outcomes."
            whyItMatters="It answers the question: 'What could happen to my portfolio over the next 60 days?' Instead of one prediction, you get a probability distribution — best case, worst case, and everything in between."
            howToUse="Check the Monte Carlo chart on your portfolio page. Focus on: (1) probability of loss — if >50%, your portfolio is more likely to lose than gain, (2) worst case 5% — this is the tail risk scenario, (3) median — the most likely outcome. If the worst case is unacceptable, reduce risk."
          />
          <Concept
            id="max_drawdown"
            title="Max Drawdown (Expanded)"
            definition="Max drawdown is the largest peak-to-trough decline in your portfolio. If your portfolio went from 150,000 to 115,000 EGP before recovering, your max drawdown was -23.3%."
            whyItMatters="Max drawdown is the most emotionally relevant risk metric. It answers: 'What's the worst drop I've experienced?' Even if your overall return is positive, a -30% drawdown means you watched a third of your wealth evaporate at some point."
            howToUse="The Risk Dashboard shows both your historical max drawdown and your current drawdown (if any). If your max drawdown exceeds your emotional tolerance, you're taking too much risk. Consider reducing position sizes, diversifying, or using tighter stop-losses."
          />
        </Section>

        {/* Macro Context */}
        <Section id="macro-context" title="Macro Context">
          <Concept
            title="Egypt's T-Bill Rate & Stocks"
            definition="Egyptian Treasury bills (T-bills) currently offer ~25% annual returns with zero risk. This is the 'risk-free rate' — the guaranteed return you could earn without any stock market risk."
            whyItMatters="When T-bill rates are high, stocks must offer even higher returns to justify their risk. A stock returning 15% per year sounds good, but if T-bills offer 25% risk-free, you're actually losing value by holding stocks. This is why the Sharpe ratio matters."
            howToUse="Before buying any stock, ask: 'Can this stock realistically beat 25% per year?' If not, T-bills might be a better use of your capital. The CBE interest rate is shown on your portfolio's Macro Context card."
          />
          <Concept
            title="USD/EGP Impact on Stocks"
            definition="The USD/EGP exchange rate affects different stocks differently. When the Egyptian pound weakens (rate goes up), exporters benefit because their foreign revenue is worth more in EGP. Importers suffer because their costs rise."
            whyItMatters="Currency movements can significantly impact stock returns. A stock that gained 10% but the EGP weakened 15% means you actually lost purchasing power in dollar terms."
            howToUse="Check the USD/EGP direction on the Macro Context card. If the pound is weakening, favor exporters and companies with dollar-denominated revenue. If it's strengthening, importers and companies with local revenue benefit."
          />
          <Concept
            id="egx30_benchmark"
            title="EGX30 as a Benchmark"
            definition="The EGX30 is the benchmark index of Egypt's 30 largest and most liquid stocks. It represents the overall market direction and is what most professional fund managers try to beat."
            whyItMatters="If your portfolio consistently underperforms the EGX30, you might be better off investing in an index fund that tracks it. Beta tells you how each of your stocks moves relative to EGX30."
            howToUse="Compare your portfolio's performance to EGX30 monthly. The Macro Context card shows EGX30's current level and trend. When EGX30 is in a strong bullish trend, most stocks benefit (rising tide lifts all boats). In a bearish trend, even good stocks may fall."
          />
        </Section>

        {/* EGX-Specific */}
        <Section id="egx" title="EGX — Egyptian Exchange">
          <Concept
            title="How EGX Works"
            definition="The Egyptian Exchange is the main stock market in Egypt, headquartered in Cairo. It has about 230+ listed companies across various sectors."
            whyItMatters="Understanding your local market's rules and behavior is essential before trading. EGX has its own quirks compared to international markets."
            howToUse="Use this app to explore all listed stocks via the dashboard. Filter by EGX30 (top 30 blue-chips), EGX70, EGX100, or NILEX (small companies)."
          />
          <Concept
            title="Trading Hours"
            definition="EGX trading sessions run Sunday through Thursday (not Monday-Friday like US markets). Pre-open: 9:30-10:00 AM, Continuous trading: 10:00 AM - 2:30 PM (Cairo time, UTC+2)."
            whyItMatters="If you place orders outside these hours, they'll queue until the next session. The market is closed on Fridays and Saturdays."
            howToUse="Plan your trading around these hours. On Thndr, you can place orders before market open and they'll execute at 10:00 AM."
          />
          <Concept
            title="T+2 Settlement"
            definition="When you sell a stock on EGX, the money doesn't appear in your account instantly. It takes 2 business days (T+2) for the trade to 'settle'."
            whyItMatters="You can't immediately reinvest the proceeds of a sale. If you sell on Sunday, you get the cash on Tuesday. This affects how quickly you can rebalance your portfolio."
            howToUse="Keep some cash available in your Thndr account for opportunities. Don't sell Stock A expecting to immediately buy Stock B — there's a 2-day wait."
          />
          <Concept
            title="EGX30 Index"
            definition="The benchmark index of the 30 most liquid and largest companies on the Egyptian Exchange, weighted by market capitalization."
            whyItMatters="EGX30 is the market's pulse. If EGX30 is up, the overall market sentiment is positive. Most professional money managers benchmark their performance against it."
            howToUse="Compare your portfolio's performance against EGX30 to see if you're beating the market. If not, you might be better off buying an EGX30 index fund."
          />
          <Concept
            title="Price Limits"
            definition="EGX has daily price limits — a stock can move up or down by a maximum percentage (typically 10%) in a single trading day. If it hits the limit, trading is halted."
            whyItMatters="This protects against extreme volatility and manipulation. But it also means that in a crisis, you might not be able to sell even at the limit-down price because there are no buyers."
            howToUse="If a stock hits its upper limit, don't chase it — it might gap down the next day. If it hits the lower limit, don't panic sell — wait for clarity."
          />
          <Concept
            title="The Role of the CBE"
            definition="The Central Bank of Egypt (CBE) controls monetary policy — interest rates, inflation management, and currency (EGP) exchange rates. Its decisions heavily impact the stock market."
            whyItMatters="When CBE raises interest rates, savings accounts become more attractive and stocks may fall. When it devalues the EGP, export companies benefit but import-heavy companies suffer."
            howToUse="Follow CBE announcements. Rate hikes generally pressure stock prices down. Rate cuts can fuel stock market rallies as investors seek higher returns than savings accounts."
          />
        </Section>
      </div>
    </div>
  );
}
