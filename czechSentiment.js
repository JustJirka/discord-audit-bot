module.exports = {
    labels: {
        // Positive
        'dobrý': 3, 'dobra': 3, 'dobrá': 3, 'dobre': 3, 'dobře': 3,
        'super': 4,
        'skvělý': 4, 'skvělá': 4, 'skvelý': 4, 'skvely': 4, 'skvěle': 4,
        'úžasný': 5, 'úžasná': 5, 'úžasně': 5,
        'pěkný': 3, 'pěkná': 3, 'pěkně': 3,
        'děkuji': 3, 'dík': 2, 'díky': 2, 'diky': 2,
        'miluji': 5, 'miluju': 5, 'láska': 5,
        'krása': 3, 'krásný': 4, 'krásná': 4,
        'radost': 3, 'raduji': 3,
        'šťastný': 4, 'stastny': 4, 'štěstí': 4,
        'výborný': 4, 'výborně': 4,
        'nejlepší': 5, 'best': 4,
        'paráda': 4, 'parádní': 4,
        'hustý': 3, 'husty': 3,
        'luxus': 4, 'luxusní': 4,
        'bomba': 4,
        'souhlas': 2, 'souhlasím': 2,
        'ano': 1, 'jo': 1,
        'zdravím': 2, 'ahoj': 1, 'čau': 1,
        'respekt': 3,
        'sláva': 4,

        // Negative
        'špatný': -3, 'špatná': -3, 'špatně': -3, 'spatny': -3,
        'zlý': -3, 'zlá': -3, 'zly': -3,
        'hrozný': -4, 'hrozná': -4, 'hrozně': -4,
        'nenávidím': -5, 'nesnáším': -4,
        'smrt': -3, 'mrtvý': -2,
        'bolest': -2, 'bolí': -2,
        'klam': -2,
        'lež': -3, 'lhaní': -3,
        'lhář': -3, 'lhar': -3,
        'zrada': -4, 'zrádce': -4,
        'chyba': -2, 'chybný': -2,
        'problém': -2,
        'odpad': -3,
        'hnus': -4, 'hnusný': -4,
        'nechutný': -3,
        'fuj': -2,
        'blbý': -2, 'blbec': -3,
        'hloupý': -2, 'hlupák': -3,
        'nuda': -2, 'nudný': -2,
        'otravný': -2, 'otrava': -2,
        'smutný': -2, 'smutek': -2,
        'ne': -1, 'ne-e': -1, 'nikdy': -2,
        'nic': -1,
        'kašlu': -2, 'seru': -3
    },

    // Custom scoring strategy to handle negation
    scoringStrategy: {
        apply: function (tokens, cursor, tokenScore) {
            if (cursor > 0) {
                const prevToken = tokens[cursor - 1];
                // Czech negation words
                const negators = ['ne', 'neni', 'není', 'nemám', 'nemam', 'nechci', 'nikdy', 'žádný', 'zadny', 'nijak'];

                if (negators.includes(prevToken.toLowerCase())) {
                    // Flip the score!
                    // But wait, if tokenScore is negative (e.g. "ne špatný" -> not bad -> good), we treat it as positive?
                    // "ne dobrý" (not good) -> 3 -> -3
                    // "ne špatný" (not bad) -> -3 -> 3
                    // Simple inversion
                    return -tokenScore;
                }
            }
            return tokenScore;
        }
    }
};
