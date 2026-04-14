interface ConceptProps {
  title: string;
  definition: string;
  whyItMatters: string;
  howToUse: string;
}

function Concept({ title, definition, whyItMatters, howToUse }: ConceptProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
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
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group mb-10" open>
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
        <Section title="Market Basics">
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
        <Section title="Technical Analysis">
          <Concept
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
        <Section title="Advanced Technical Indicators">
          <Concept
            title="Beta"
            definition="Beta measures how much a stock moves relative to the overall market (EGX30). A beta of 1.5 means the stock moves 50% more than the market in both directions."
            whyItMatters="Beta tells you how risky a stock is compared to the market. High-beta stocks (>1.3) amplify market moves — great in bull markets, painful in bear markets. Low-beta stocks (<0.8) are defensive and more stable."
            howToUse="Check the beta value on the stock detail page. If you want a calmer portfolio, pick low-beta stocks. If you believe the market is going up and want to amplify gains, pick high-beta stocks. Example: COMI (banking) often has beta > 1 because banks are sensitive to economic cycles."
          />
          <Concept
            title="Golden Cross / Death Cross"
            definition="A Golden Cross occurs when the 50-day SMA crosses above the 200-day SMA. A Death Cross is the opposite — the 50-day crosses below the 200-day."
            whyItMatters="These are among the most widely-watched signals in technical analysis. A Golden Cross often precedes sustained uptrends. A Death Cross suggests the downtrend may continue. Institutional investors use these as buy/sell triggers."
            howToUse="Look for the Golden/Death Cross badge on the stock detail page. When a Golden Cross occurs, it's a potential entry point. When a Death Cross occurs, consider tightening stop-losses. These signals work best on daily charts with the 50/200 SMA combination."
          />
          <Concept
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
            title="ATR — Average True Range"
            definition="ATR measures the average daily price movement (including gaps), calculated over the last 14 days. If ATR is 3.5 EGP, the stock typically moves 3.5 EGP per day."
            whyItMatters="ATR is essential for setting stop-losses. Setting a stop-loss within 1x ATR means you'll likely get stopped out by normal price noise. A stop-loss at 1.5-2x ATR gives the trade room to breathe."
            howToUse="Check the ATR value in the stats panel. Set your stop-loss at least 1.5x ATR below your entry price. Example: if you buy at 100 EGP and ATR is 4 EGP, set your stop at 94 EGP (100 - 1.5 × 4). The advice panel will suggest specific stop-loss distances based on ATR."
          />
          <Concept
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
            title="Multi-Timeframe Analysis"
            definition="Multi-timeframe analysis compares signals on different chart intervals (e.g., Daily and Weekly) to determine if a trend is genuine or just short-term noise. When both timeframes agree, the signal is much stronger."
            whyItMatters="A stock that looks bullish on a daily chart may actually be in a downtrend on the weekly chart — you'd be buying a temporary bounce inside a larger decline. When daily and weekly trends align (both bullish or both bearish), the probability of success is significantly higher."
            howToUse="Look for the alignment badge on the stock detail page (e.g., 'Daily + Weekly aligned (bullish)'). When you see this, any buy signal from RSI, MACD, or ADX is more reliable. When you see 'Daily bullish vs Weekly bearish — mixed signals', be cautious: you may be trading against the larger trend. Reduce position size or wait for the weekly trend to turn."
          />
          <Concept
            title="Stochastic Oscillator"
            definition="The Stochastic Oscillator compares a stock's closing price to its price range over 14 days. It has two lines: %K (fast) and %D (slow signal), both ranging from 0 to 100."
            whyItMatters="Like RSI, it identifies overbought (>80) and oversold (<20) conditions. The key signal is the crossover: when %K crosses above %D from below 20, it's a buy signal. When %K crosses below %D from above 80, it's a sell signal."
            howToUse="Check the Stochastic tab in the indicators panel. The strongest buy signals come when: (1) both lines are below 20, (2) %K crosses above %D, and (3) the price is near a support level. This triple confirmation gives higher-probability entries."
          />
          <Concept
            title="ADX — Average Directional Index"
            definition="ADX measures trend strength on a 0-100 scale, regardless of direction. It also comes with two companion lines: DI+ (buying pressure) and DI- (selling pressure). ADX above 25 indicates a strong trend; below 20 means the market is ranging (no clear trend)."
            whyItMatters="Many traders buy breakouts only to get burned when the move fades quickly. ADX tells you if a trend has enough strength to sustain itself. High ADX means the current trend — up or down — is powerful and likely to continue."
            howToUse="Use ADX as a filter: only trade momentum signals (like RSI oversold or MACD crossover) when ADX is above 25. When DI+ is above DI-, buyers are dominant — look for long entries. When DI- is above DI+, sellers are in control — be cautious. Ignore signals when ADX is below 20; the market is just noise."
          />
          <Concept
            title="MFI — Money Flow Index"
            definition="MFI is a volume-weighted RSI that combines price movement and trading volume to show whether money is flowing into or out of a stock. It ranges from 0 to 100. Above 80 = overbought, below 20 = oversold."
            whyItMatters="MFI is harder to fake than RSI because it requires volume confirmation. A stock can briefly spike in price on low volume (RSI might look overbought), but MFI won't confirm unless real buying pressure (volume) backs the move."
            howToUse="Use MFI alongside RSI for higher-conviction signals. If both RSI and MFI are below 20 simultaneously, the oversold signal is very strong. MFI divergence is especially powerful: if price makes a new high but MFI makes a lower high, selling pressure is growing even though price looks strong — consider reducing your position."
          />
          <Concept
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
        <Section title="Composite Score">
          <Concept
            title="What is the Composite Score?"
            definition="The Composite Score is a single 0–100 number that blends five technical categories — Trend (25%), Momentum (25%), Volume (20%), Volatility (15%), and Divergence (15%) — into one glanceable signal. Scores translate to signals: 0–20 Strong Sell, 21–40 Sell, 41–60 Hold, 61–80 Buy, 81–100 Strong Buy."
            whyItMatters="Looking at 15 indicators individually and reaching a coherent conclusion is hard, especially for new investors. The composite score does this blending for you, weighting each category according to its importance (which you can customize). It turns complex data into one actionable read."
            howToUse="Find the composite score on every stock detail page (the circular gauge at the top), on portfolio holding rows, and as an average across your whole portfolio. Use it as a first filter: only research stocks scoring above 60 (Buy) if you are looking for longs. Use it as a quick health check: a portfolio average below 40 means most of your holdings have deteriorating technicals."
          />
          <Concept
            title="The Five Score Categories"
            definition="Trend (25%): Measures price vs SMA50/200, ADX strength, DI± direction, and Golden/Death Cross. Momentum (25%): Blends RSI, MACD histogram direction, and Stochastic crossover. Volume (20%): Combines OBV trend, MFI overbought/oversold, and volume-price confirmation. Volatility (15%): Uses Bollinger Band position and squeeze state. Divergence (15%): Rewards bullish RSI/MACD divergence and penalizes bearish divergence."
            whyItMatters="Each category captures a different dimension of a stock's health. A stock can score high on Trend but low on Momentum — indicating the trend is established but may be slowing. Understanding which category is dragging the score helps you interpret what the market is telling you."
            howToUse="Tap any category bar in the Score Breakdown to expand its reasons list — plain-language explanations of exactly what's contributing positively or negatively. This turns the score from a black box into a teaching tool."
          />
          <Concept
            title="Customizing Weights"
            definition="You can adjust the weight given to each of the five categories via the ⚙ Adjust Weights button on any Score Breakdown card. Presets: Balanced (25/25/20/15/15), Trend Follower (40/25/15/15/5), Reversal Hunter (15/25/15/15/30). Weights are normalized to always sum to 100%."
            whyItMatters="Different traders have different styles. A trend follower wants to know whether the stock has strong directional momentum and ignores divergence. A reversal hunter specifically hunts stocks with divergence signals after a sustained move. Customizing weights lets the score reflect your personal strategy."
            howToUse="Start with Balanced. After a few weeks, if you find yourself consistently making decisions based on trend over divergence, switch to Trend Follower. Weights are saved to your account and immediately recalculate all scores across the app. You can always reset to Balanced if you want a neutral read."
          />
          <Concept
            title="Composite Score Limitations"
            definition="The Composite Score is an educational tool built on technical indicators. It does not predict the future, factor in company fundamentals (earnings, debt, management), incorporate news events, or account for Egyptian macro conditions (CBE rates, currency). A technically perfect stock can still fall if bad news hits."
            whyItMatters="No single number can capture everything. A score of 85 (Strong Buy) means the technical setup is favorable — not that you're guaranteed to profit. The score has no knowledge of upcoming earnings reports, regulatory changes, or geopolitical events that could override any technical signal instantly."
            howToUse="Use the score as one input in a broader decision process: (1) Is the technical score ≥ 60? (2) Are fundamentals reasonable? (3) Is the macro environment supportive? (4) Is position sizing appropriate? All four boxes should ideally be checked before taking a position. The score helps with #1 only."
          />
        </Section>

        {/* Risk Management */}
        <Section title="Risk Management">
          <Concept
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
        </Section>

        {/* Portfolio Risk Metrics */}
        <Section title="Portfolio Risk Metrics">
          <Concept
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
            title="Max Drawdown (Expanded)"
            definition="Max drawdown is the largest peak-to-trough decline in your portfolio. If your portfolio went from 150,000 to 115,000 EGP before recovering, your max drawdown was -23.3%."
            whyItMatters="Max drawdown is the most emotionally relevant risk metric. It answers: 'What's the worst drop I've experienced?' Even if your overall return is positive, a -30% drawdown means you watched a third of your wealth evaporate at some point."
            howToUse="The Risk Dashboard shows both your historical max drawdown and your current drawdown (if any). If your max drawdown exceeds your emotional tolerance, you're taking too much risk. Consider reducing position sizes, diversifying, or using tighter stop-losses."
          />
        </Section>

        {/* Macro Context */}
        <Section title="Macro Context">
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
            title="EGX30 as a Benchmark"
            definition="The EGX30 is the benchmark index of Egypt's 30 largest and most liquid stocks. It represents the overall market direction and is what most professional fund managers try to beat."
            whyItMatters="If your portfolio consistently underperforms the EGX30, you might be better off investing in an index fund that tracks it. Beta tells you how each of your stocks moves relative to EGX30."
            howToUse="Compare your portfolio's performance to EGX30 monthly. The Macro Context card shows EGX30's current level and trend. When EGX30 is in a strong bullish trend, most stocks benefit (rising tide lifts all boats). In a bearish trend, even good stocks may fall."
          />
        </Section>

        {/* EGX-Specific */}
        <Section title="EGX — Egyptian Exchange">
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
