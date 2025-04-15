package jwt

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/mmmakskl/HeritageKeeper/service/internal/transport/http-server/middleware"
)

func GetClaimsFromContext(ctx context.Context) (jwt.MapClaims, error) {
	claims, ok := ctx.Value(middleware.ClaimsKey).(jwt.MapClaims)
	if !ok {
		return nil, errors.New("claims not found in context")
	}
	return claims, nil
}

func GetUserIDFromClaims(claims jwt.MapClaims) (string, error) {
	if claims == nil {
		return "", errors.New("claims are nil")
	}

	if userID, ok := claims["uid"]; ok {
		switch v := userID.(type) {
		case float64:
			return fmt.Sprintf("%.0f", v), nil
		case string:
			return v, nil
		default:
			return "", fmt.Errorf("unknown uid type: %T", v)
		}
	}
	return "", fmt.Errorf("uid not found in claims")
}
