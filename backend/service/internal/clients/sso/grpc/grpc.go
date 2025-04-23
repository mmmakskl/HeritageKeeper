package grpc

import (
	"context"
	"log/slog"
	"time"

	grpclog "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	grpcretry "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/retry"
	ssov1 "github.com/mmmakskl/protos/gen/go/sso"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
)

type Client struct {
	api ssov1.AuthClient
	log *slog.Logger
}

func New(
	ctx context.Context,
	log *slog.Logger,
	addr string,
	timeout time.Duration,
	retriesCount int,
) (*Client, error) {
	const op = "grpc.new"

	retryOpts := []grpcretry.CallOption{
		grpcretry.WithMax(uint(retriesCount)),
		grpcretry.WithPerRetryTimeout(timeout),
		grpcretry.WithCodes(codes.NotFound, codes.Aborted, codes.DeadlineExceeded),
	}

	logOpts := []grpclog.Option{
		grpclog.WithLogOnEvents(grpclog.PayloadReceived, grpclog.PayloadSent),
	}

	cc, err := grpc.DialContext(ctx, addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithChainUnaryInterceptor(
			grpclog.UnaryClientInterceptor(InterceptorLogger(log), logOpts...),
			grpcretry.UnaryClientInterceptor(retryOpts...),
		),
	)
	if err != nil {
		log.ErrorContext(ctx, op, "failed to connect to grpc server", err)
		return nil, err
	}

	return &Client{
		api: ssov1.NewAuthClient(cc),
		log: log.With("component", "sso-grpc-client"),
	}, nil
}

func InterceptorLogger(l *slog.Logger) grpclog.Logger {
	return grpclog.LoggerFunc(func(ctx context.Context, level grpclog.Level, msg string, fields ...any) {
		filterFields := make([]any, 0, len(fields))
		for i := 0; i < len(fields); i += 2 {
			key := fields[i].(string)
			if key == "grpc.request.content" || key == "grpc.response.content" {
				continue
			}
			filterFields = append(filterFields, fields[i], fields[i+1])
		}

		if level == grpclog.LevelError {
			l.ErrorContext(ctx, msg, fields...)
		} else if level == grpclog.LevelInfo {
			l.InfoContext(ctx, msg, fields...)
		} else {
			l.DebugContext(ctx, msg, filterFields...)
		}
	})
}

func (c *Client) Register(ctx context.Context, email string, passwd string) (int64, error) {
	const op = "grpc.client.register"

	c.log.DebugContext(ctx, op, "register user", slog.String("email", email))

	user, err := c.api.Register(ctx, &ssov1.RegisterRequest{
		Email:    email,
		Password: passwd,
	})
	if err != nil {
		c.log.ErrorContext(ctx, op, "failed to register user", err)
		return 0, err
	}

	return user.UserId, nil
}

func (c *Client) Login(ctx context.Context, email string, passwd string, appid int32) (string, error) {
	const op = "grpc.client.login"

	c.log.DebugContext(ctx, op, "login user", slog.String("email", email))

	user, err := c.api.Login(ctx, &ssov1.LoginRequest{
		Email:    email,
		Password: passwd,
		AppId:    appid,
	})
	if err != nil {
		c.log.ErrorContext(ctx, op, "failed to login user", err)
		return "", err
	}

	return user.Token, nil
}
